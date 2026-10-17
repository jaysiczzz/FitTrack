import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  useWindowDimensions,
  LayoutChangeEvent,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import ModalCloseButton from '../ui/ModalCloseButton';
import Input from '../ui/Input';
import FieldLabel from '../ui/FieldLabel';
import { capitalizeWords, formatGoalLabel } from '@/utils/formatters';
import { updateUserProfile } from '@/api/user';
import { useAuth } from '@/context/AuthContext';
import { ACTIVITY_LEVEL_OPTIONS, ActivityLevel } from '@/constants/activityLevels';
import { useToast } from '@/context/ToastContext';
import { hapticFeedback } from '@/utils/haptics';
import { getFriendlyErrorMessage } from '@/utils/errorMapper';
import {
  useHeightUnit,
  useWeightUnit,
  HeightUnit,
  WeightUnit,
  cmToFtIn,
  ftInToCm,
  kgToLbs,
  lbsToKg,
} from '@/constants/units';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onProfileUpdated?: (updatedUser: any) => void;
}

export default function EditProfileModal({
  visible,
  onClose,
  onProfileUpdated,
}: EditProfileModalProps) {
  const { colors } = useThemeColors();
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { width: windowWidth, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [heightUnit, setHeightUnit] = useHeightUnit();
  const [weightUnit, setWeightUnit] = useWeightUnit();
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [weightLbs, setWeightLbs] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState<'muscle' | 'loss'>('muscle');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('LIGHTLY_ACTIVE');

  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [heightError, setHeightError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [ageError, setAgeError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [measuredContentWidth, setMeasuredContentWidth] = useState(0);

  // Responsive column math
  const GAP = 12; // gap-3 = 12px
  const MIN_COLUMN_WIDTH = 140;

  // Fallback content width: modal max-w-lg is 512px; px-5 is 40px horizontal padding
  const estimatedWidth =
    windowWidth >= 768 ? Math.min(windowWidth, 512) - 40 : Math.max(windowWidth - 40, 200);
  const contentWidth = measuredContentWidth > 0 ? measuredContentWidth : estimatedWidth;

  const twoColWidth = (contentWidth - GAP) / 2;
  const isStacked = fontScale > 1.25 || twoColWidth < MIN_COLUMN_WIDTH;
  const columnWidth = isStacked ? contentWidth : twoColWidth;

  const handleContentLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - measuredContentWidth) > 1) {
      setMeasuredContentWidth(width);
    }
  };

  useEffect(() => {
    if (visible && user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      if (user.height !== undefined) {
        setHeight(String(user.height));
        const { feet: f, inches: i } = cmToFtIn(user.height);
        setFeet(String(f));
        setInches(String(i));
      }
      if (user.weight !== undefined) {
        setWeight(String(user.weight));
        setWeightLbs(String(kgToLbs(user.weight)));
      }
      if (user.age !== undefined) setAge(String(user.age));
      if (user.goal) {
        setGoal(user.goal === 'MUSCLE_GAIN' ? 'muscle' : 'loss');
      }
      if (user.gender) {
        setGender(user.gender);
      }
      if (user.activityLevel) {
        setActivityLevel(user.activityLevel);
      }
      setFirstNameError(null);
      setLastNameError(null);
      setHeightError(null);
      setWeightError(null);
      setAgeError(null);
    }
  }, [visible, user]);

  const handleSave = async () => {
    setFirstNameError(null);
    setLastNameError(null);
    setHeightError(null);
    setWeightError(null);
    setAgeError(null);

    const cleanFirst = capitalizeWords(firstName).trim();
    const cleanLast = capitalizeWords(lastName).trim();
    let hNum = Number(height);
    if (heightUnit === 'FT_IN') {
      const f = parseInt(feet, 10) || 0;
      const i = parseInt(inches, 10) || 0;
      hNum = ftInToCm(f, i);
    }

    let wNum = Number(weight);
    if (weightUnit === 'LBS') {
      const lbs = parseFloat(weightLbs) || 0;
      wNum = lbsToKg(lbs);
    }
    const aNum = Number(age);

    let hasError = false;

    if (!cleanFirst) {
      setFirstNameError('First name is required');
      hasError = true;
    } else if (cleanFirst.length > 50) {
      setFirstNameError('Max 50 characters');
      hasError = true;
    }

    if (!cleanLast) {
      setLastNameError('Last name is required');
      hasError = true;
    } else if (cleanLast.length > 50) {
      setLastNameError('Max 50 characters');
      hasError = true;
    }

    if (heightUnit === 'CM') {
      if (!height.trim()) {
        setHeightError('Height is required');
        hasError = true;
      } else if (isNaN(hNum) || hNum < 50 || hNum > 250) {
        setHeightError('Enter valid height (50-250 cm)');
        hasError = true;
      }
    } else {
      const f = parseInt(feet, 10);
      const i = parseInt(inches, 10);
      if (!feet.trim()) {
        setHeightError('Feet is required');
        hasError = true;
      } else if (isNaN(f) || f < 2 || f > 8 || (inches.trim() && (isNaN(i) || i < 0 || i >= 12))) {
        setHeightError('Enter valid height (e.g. 5 ft 10 in)');
        hasError = true;
      }
    }

    if (weightUnit === 'KG') {
      if (!weight.trim()) {
        setWeightError('Weight is required');
        hasError = true;
      } else if (isNaN(wNum) || wNum < 20 || wNum > 350) {
        setWeightError('Enter valid weight (20-350 kg)');
        hasError = true;
      }
    } else {
      const lbs = parseFloat(weightLbs);
      if (!weightLbs.trim()) {
        setWeightError('Weight is required');
        hasError = true;
      } else if (isNaN(lbs) || lbs < 45 || lbs > 800) {
        setWeightError('Enter valid weight (45-800 lbs)');
        hasError = true;
      }
    }

    if (!age.trim()) {
      setAgeError('Age is required');
      hasError = true;
    } else if (isNaN(aNum) || aNum < 12 || aNum > 110 || !Number.isInteger(aNum)) {
      setAgeError('Enter valid age (12-110)');
      hasError = true;
    }

    if (hasError) return;

    try {
      hapticFeedback.light();
      setSaving(true);
      const mappedGoal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS' = goal === 'muscle' ? 'MUSCLE_GAIN' : 'WEIGHT_LOSS';

      const res = await updateUserProfile({
        firstName: cleanFirst,
        lastName: cleanLast,
        height: Math.round(hNum),
        weight: Number(wNum.toFixed(1)),
        age: Math.round(aNum),
        goal: mappedGoal,
        gender,
        activityLevel,
      });

      const updatedUserData = {
        ...(res.user || user),
        firstName: cleanFirst,
        lastName: cleanLast,
        height: Math.round(hNum),
        weight: Number(wNum.toFixed(1)),
        age: Math.round(aNum),
        goal: mappedGoal,
        gender,
        activityLevel,
      };

      await updateUser(updatedUserData as any);

      if (onProfileUpdated) {
        onProfileUpdated(updatedUserData);
      }

      showSuccess('Profile Saved', 'Personal information updated successfully.');
      onClose();
    } catch (err: any) {
      showError('Save Failed', getFriendlyErrorMessage(err, 'Could not update profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  // Clicking outside / on the backdrop dismisses the keyboard, but NEVER closes the modal
  const handleBackdropPress = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end md:justify-center md:items-center bg-black/60 p-0 md:p-4"
      >
        <Pressable
          className="absolute inset-0"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={handleBackdropPress}
          accessible={false}
        />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl md:rounded-3xl border-t md:border border-input-border dark:border-input-border-dark w-full md:max-w-lg h-[88%] md:h-[90%] max-h-[90%] shadow-2xl flex-col">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-input-border dark:border-input-border-dark">
            <View className="flex-1 pr-2 min-w-0">
              <Text className="text-base font-bold text-text-primary dark:text-text-primary-dark" numberOfLines={1}>
                Edit Personal Information
              </Text>
              <Text className="text-[11px] text-text-muted dark:text-text-muted-dark" numberOfLines={1}>
                Manage your athlete details and target focus
              </Text>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          <ScrollView
            className="flex-1 px-5 pt-4"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            bounces={false}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}
          >
            <View onLayout={handleContentLayout} className="w-full">
              {/* Row 1: First & Last Name */}
              <View className={isStacked ? 'flex-col' : 'flex-row gap-3'}>
                <View className={isStacked ? 'w-full' : 'flex-1 min-w-0'}>
                  <Input
                    label="First Name"
                    accessibilityLabel="First Name"
                    autoCapitalize="words"
                    value={firstName}
                    onChangeText={(val) => {
                      setFirstName(capitalizeWords(val));
                      if (firstNameError) setFirstNameError(null);
                    }}
                    placeholder="First name"
                    error={firstNameError || undefined}
                  />
                </View>

                <View className={isStacked ? 'w-full' : 'flex-1 min-w-0'}>
                  <Input
                    label="Last Name"
                    accessibilityLabel="Last Name"
                    autoCapitalize="words"
                    value={lastName}
                    onChangeText={(val) => {
                      setLastName(capitalizeWords(val));
                      if (lastNameError) setLastNameError(null);
                    }}
                    placeholder="Last name"
                    error={lastNameError || undefined}
                  />
                </View>
              </View>

              {/* Unit Toggles Row */}
              <View className="flex-row items-center justify-between mb-2 px-0.5">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark">
                    Height:
                  </Text>
                  <View className="flex-row bg-input dark:bg-input-dark p-0.5 rounded-lg border border-input-border dark:border-input-border-dark">
                    <Pressable
                      onPress={() => {
                        hapticFeedback.light();
                        setHeightUnit('CM');
                        const f = parseInt(feet, 10) || 0;
                        const i = parseInt(inches, 10) || 0;
                        if (f > 0 || i > 0) setHeight(String(ftInToCm(f, i)));
                      }}
                      className={`px-2 py-0.5 rounded ${heightUnit === 'CM' ? 'bg-accent dark:bg-accent-dark' : 'bg-transparent'}`}
                    >
                      <Text className={`text-[10px] font-bold ${heightUnit === 'CM' ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'}`}>
                        cm
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        hapticFeedback.light();
                        setHeightUnit('FT_IN');
                        const cm = parseFloat(height);
                        if (cm && cm > 0) {
                          const { feet: f, inches: i } = cmToFtIn(cm);
                          setFeet(String(f));
                          setInches(String(i));
                        }
                      }}
                      className={`px-2 py-0.5 rounded ${heightUnit === 'FT_IN' ? 'bg-accent dark:bg-accent-dark' : 'bg-transparent'}`}
                    >
                      <Text className={`text-[10px] font-bold ${heightUnit === 'FT_IN' ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'}`}>
                        ft/in
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View className="flex-row items-center gap-1.5">
                  <Text className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark">
                    Weight:
                  </Text>
                  <View className="flex-row bg-input dark:bg-input-dark p-0.5 rounded-lg border border-input-border dark:border-input-border-dark">
                    <Pressable
                      onPress={() => {
                        hapticFeedback.light();
                        setWeightUnit('KG');
                        const lbs = parseFloat(weightLbs);
                        if (lbs && lbs > 0) setWeight(String(lbsToKg(lbs)));
                      }}
                      className={`px-2 py-0.5 rounded ${weightUnit === 'KG' ? 'bg-accent dark:bg-accent-dark' : 'bg-transparent'}`}
                    >
                      <Text className={`text-[10px] font-bold ${weightUnit === 'KG' ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'}`}>
                        kg
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        hapticFeedback.light();
                        setWeightUnit('LBS');
                        const kg = parseFloat(weight);
                        if (kg && kg > 0) setWeightLbs(String(kgToLbs(kg)));
                      }}
                      className={`px-2 py-0.5 rounded ${weightUnit === 'LBS' ? 'bg-accent dark:bg-accent-dark' : 'bg-transparent'}`}
                    >
                      <Text className={`text-[10px] font-bold ${weightUnit === 'LBS' ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'}`}>
                        lbs
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Row 2: Height & Weight */}
              <View className={isStacked ? 'flex-col' : 'flex-row gap-3'}>
                <View className={isStacked ? 'w-full' : 'flex-1 min-w-0'}>
                  {heightUnit === 'CM' ? (
                    <Input
                      label="Height"
                      accessibilityLabel="Height in centimeters"
                      value={height}
                      onChangeText={(val) => {
                        setHeight(val);
                        if (heightError) setHeightError(null);
                      }}
                      placeholder="e.g. 175"
                      keyboardType="decimal-pad"
                      unit="cm"
                      error={heightError || undefined}
                    />
                  ) : (
                    <View className="flex-row gap-2">
                      <View className="flex-1">
                        <Input
                          label="Height (ft)"
                          accessibilityLabel="Height in feet"
                          value={feet}
                          onChangeText={(val) => {
                            setFeet(val);
                            if (heightError) setHeightError(null);
                          }}
                          placeholder="5"
                          keyboardType="number-pad"
                          unit="ft"
                          error={heightError ? ' ' : undefined}
                        />
                      </View>
                      <View className="flex-1">
                        <Input
                          label="(in)"
                          accessibilityLabel="Height in inches"
                          value={inches}
                          onChangeText={(val) => {
                            setInches(val);
                            if (heightError) setHeightError(null);
                          }}
                          placeholder="10"
                          keyboardType="number-pad"
                          unit="in"
                          error={heightError || undefined}
                        />
                      </View>
                    </View>
                  )}
                </View>

                <View className={isStacked ? 'w-full' : 'flex-1 min-w-0'}>
                  {weightUnit === 'KG' ? (
                    <Input
                      label="Weight"
                      accessibilityLabel="Weight in kilograms"
                      value={weight}
                      onChangeText={(val) => {
                        setWeight(val);
                        if (weightError) setWeightError(null);
                      }}
                      placeholder="e.g. 70"
                      keyboardType="decimal-pad"
                      unit="kg"
                      error={weightError || undefined}
                    />
                  ) : (
                    <Input
                      label="Weight"
                      accessibilityLabel="Weight in pounds"
                      value={weightLbs}
                      onChangeText={(val) => {
                        setWeightLbs(val);
                        if (weightError) setWeightError(null);
                      }}
                      placeholder="e.g. 154"
                      keyboardType="decimal-pad"
                      unit="lbs"
                      error={weightError || undefined}
                    />
                  )}
                </View>
              </View>

              {/* Row 3: Age - Computed Width & Horizontally Centered */}
              <View className="w-full">
                <View className="w-full">
                  <Input
                    label="Age"
                    accessibilityLabel="Age in years"
                    value={age}
                    onChangeText={(val) => {
                      setAge(val);
                      if (ageError) setAgeError(null);
                    }}
                    placeholder="e.g. 24"
                    keyboardType="number-pad"
                    unit="yrs"
                    error={ageError || undefined}
                  />
                </View>
              </View>

              {/* Biological Sex Section */}
              <View className="mb-4">
                <FieldLabel>Biological Sex</FieldLabel>
                <View
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Biological Sex"
                  className="flex-row gap-2"
                >
                  {(['MALE', 'FEMALE'] as const).map((g) => {
                    const isSelected = gender === g;
                    const label = g === 'MALE' ? 'Male' : 'Female';
                    return (
                      <TouchableOpacity
                        key={g}
                        activeOpacity={0.7}
                        onPress={() => {
                          hapticFeedback.light();
                          setGender(g);
                        }}
                        className={`flex-1 min-h-[42px] py-2 px-3 rounded-xl border flex-row items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-accent/15 border-accent dark:border-accent-dark'
                            : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            isSelected
                              ? 'text-accent dark:text-accent-dark'
                              : 'text-text-muted dark:text-text-muted-dark'
                          }`}
                        >
                          {label}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={colors.accent}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Daily Activity Level Section */}
              <View className="mb-4">
                <FieldLabel>Daily Activity Level</FieldLabel>
                <View
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Daily Activity Level"
                  className="flex-row flex-wrap gap-2"
                >
                  {ACTIVITY_LEVEL_OPTIONS.map((opt) => {
                    const isSelected = activityLevel === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        activeOpacity={0.7}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected, checked: isSelected }}
                        accessibilityLabel={opt.label}
                        onPress={() => {
                          hapticFeedback.light();
                          setActivityLevel(opt.key);
                        }}
                        className={`${
                          isStacked ? 'w-full' : 'flex-1 min-w-[47%]'
                        } min-h-[52px] p-2.5 rounded-xl border flex-col justify-center ${
                          isSelected
                            ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent dark:border-accent-dark'
                            : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                        }`}
                      >
                        <View className="flex-row items-center justify-between mb-0.5">
                          <View className="flex-row items-center gap-1.5 flex-1 mr-1">
                            <Text className="text-sm">{opt.icon}</Text>
                            <Text
                              numberOfLines={1}
                              className={`text-xs font-bold ${
                                isSelected
                                  ? 'text-accent dark:text-accent-dark'
                                  : 'text-text-primary dark:text-text-primary-dark'
                              }`}
                            >
                              {opt.label}
                            </Text>
                          </View>
                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={14}
                              color={colors.accent}
                            />
                          )}
                        </View>
                        <Text
                          numberOfLines={1}
                          className="text-[10px] text-text-muted dark:text-text-muted-dark"
                        >
                          {opt.description}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Primary Fitness Goal Section */}
              <View className="mb-6">
                <FieldLabel>Primary Fitness Goal</FieldLabel>
                <View
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Primary Fitness Goal"
                  className={isStacked ? 'flex-col gap-2.5' : 'flex-row gap-3'}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: goal === 'muscle', checked: goal === 'muscle' }}
                    accessibilityLabel="Muscle Gain"
                    onPress={() => {
                      hapticFeedback.light();
                      setGoal('muscle');
                    }}
                    className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-xl border flex-row items-center justify-center gap-1.5 ${
                      goal === 'muscle'
                        ? 'bg-accent/15 border-accent dark:border-accent-dark'
                        : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        goal === 'muscle'
                          ? 'text-accent dark:text-accent-dark'
                          : 'text-text-muted dark:text-text-muted-dark'
                      }`}
                    >
                      {formatGoalLabel('MUSCLE_GAIN')}
                    </Text>
                    {goal === 'muscle' && (
                      <Ionicons
                        name="checkmark-circle"
                        size={15}
                        color={colors.accent}
                      />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: goal === 'loss', checked: goal === 'loss' }}
                    accessibilityLabel="Weight Loss"
                    onPress={() => {
                      hapticFeedback.light();
                      setGoal('loss');
                    }}
                    className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-xl border flex-row items-center justify-center gap-1.5 ${
                      goal === 'loss'
                        ? 'bg-accent/15 border-accent dark:border-accent-dark'
                        : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        goal === 'loss'
                          ? 'text-accent dark:text-accent-dark'
                          : 'text-text-muted dark:text-text-muted-dark'
                      }`}
                    >
                      {formatGoalLabel('WEIGHT_LOSS')}
                    </Text>
                    {goal === 'loss' && (
                      <Ionicons
                        name="checkmark-circle"
                        size={15}
                        color={colors.accent}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={saving}
                onPress={handleSave}
                accessibilityRole="button"
                accessibilityLabel="Save Changes"
                className="w-full min-h-[48px] py-3.5 rounded-xl bg-accent dark:bg-accent-dark items-center justify-center shadow-md flex-row mt-1"
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-sharp" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text className="text-sm font-bold text-white uppercase tracking-wide">
                      Save Changes
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
