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
import { useToast } from '@/context/ToastContext';
import { hapticFeedback } from '@/utils/haptics';

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

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState<'muscle' | 'loss'>('muscle');

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
      if (user.height !== undefined) setHeight(String(user.height));
      if (user.weight !== undefined) setWeight(String(user.weight));
      if (user.age !== undefined) setAge(String(user.age));
      if (user.goal) {
        setGoal(user.goal === 'MUSCLE_GAIN' ? 'muscle' : 'loss');
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
    const hNum = Number(height);
    const wNum = Number(weight);
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

    if (!height.trim()) {
      setHeightError('Height is required');
      hasError = true;
    } else if (isNaN(hNum) || hNum < 50 || hNum > 250) {
      setHeightError('Enter valid height (50-250 cm)');
      hasError = true;
    }

    if (!weight.trim()) {
      setWeightError('Weight is required');
      hasError = true;
    } else if (isNaN(wNum) || wNum < 20 || wNum > 350) {
      setWeightError('Enter valid weight (20-350 kg)');
      hasError = true;
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
      });

      const updatedUserData = {
        ...(res.user || user),
        firstName: cleanFirst,
        lastName: cleanLast,
        height: Math.round(hNum),
        weight: Number(wNum.toFixed(1)),
        age: Math.round(aNum),
        goal: mappedGoal,
      };

      await updateUser(updatedUserData as any);

      if (onProfileUpdated) {
        onProfileUpdated(updatedUserData);
      }

      showSuccess('Profile Saved', 'Personal information updated successfully.');
      onClose();
    } catch (err: any) {
      showError('Save Failed', err?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end md:justify-center md:items-center bg-black/60 p-0 md:p-4"
      >
        <Pressable
          className="flex-1 w-full"
          onPress={onClose}
          accessibilityLabel="Dismiss modal backdrop"
        />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl md:rounded-3xl border-t md:border border-input-border dark:border-input-border-dark w-full md:max-w-lg max-h-[88%] md:max-h-[90%] shadow-2xl flex-col">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-input-border dark:border-input-border-dark">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-accent/15 items-center justify-center">
                <Ionicons name="person-outline" size={17} color={colors.accent} />
              </View>
              <View>
                <Text className="text-base font-bold text-text-primary dark:text-text-primary-dark">
                  Edit Personal Information
                </Text>
                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                  Manage your athlete details and target focus
                </Text>
              </View>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          <ScrollView
            className="flex-1 px-5 pt-4"
            keyboardShouldPersistTaps="handled"
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

              {/* Row 2: Height & Weight */}
              <View className={isStacked ? 'flex-col' : 'flex-row gap-3'}>
                <View className={isStacked ? 'w-full' : 'flex-1 min-w-0'}>
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
                </View>

                <View className={isStacked ? 'w-full' : 'flex-1 min-w-0'}>
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
                    className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-xl border flex-row items-center justify-center gap-2 ${
                      goal === 'muscle'
                        ? 'bg-accent/15 border-accent dark:border-accent-dark'
                        : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                    }`}
                  >
                    <Ionicons
                      name="barbell"
                      size={16}
                      color={goal === 'muscle' ? colors.accent : colors.textMuted}
                    />
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
                    className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-xl border flex-row items-center justify-center gap-2 ${
                      goal === 'loss'
                        ? 'bg-accent/15 border-accent dark:border-accent-dark'
                        : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                    }`}
                  >
                    <Ionicons
                      name="flame"
                      size={16}
                      color={goal === 'loss' ? colors.accent : colors.textMuted}
                    />
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
