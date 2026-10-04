import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import ModalCloseButton from '../ui/ModalCloseButton';
import { capitalizeWords } from '@/utils/formatters';
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

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState<'muscle' | 'loss'>('muscle');
  const [saving, setSaving] = useState(false);

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
    }
  }, [visible, user]);

  const handleSave = async () => {
    const cleanFirst = capitalizeWords(firstName);
    const cleanLast = capitalizeWords(lastName);
    const hNum = Number(height);
    const wNum = Number(weight);
    const aNum = Number(age);

    if (!cleanFirst || !cleanLast) {
      showError('Validation Error', 'First and last names are required.');
      return;
    }
    if (isNaN(hNum) || hNum <= 0 || hNum > 300) {
      showError('Validation Error', 'Please enter a valid height between 1 and 300 cm.');
      return;
    }
    if (isNaN(wNum) || wNum <= 0 || wNum > 500) {
      showError('Validation Error', 'Please enter a valid weight between 1 and 500 kg.');
      return;
    }
    if (isNaN(aNum) || aNum <= 0 || aNum > 120) {
      showError('Validation Error', 'Please enter a valid age between 1 and 120.');
      return;
    }

    try {
      hapticFeedback.light();
      setSaving(true);
      const mappedGoal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS' = goal === 'muscle' ? 'MUSCLE_GAIN' : 'WEIGHT_LOSS';

      const res = await updateUserProfile({
        firstName: cleanFirst,
        lastName: cleanLast,
        height: hNum,
        weight: wNum,
        age: aNum,
        goal: mappedGoal,
      });

      const updatedUserData = {
        ...(res.user || user),
        firstName: cleanFirst,
        lastName: cleanLast,
        height: hNum,
        weight: wNum,
        age: aNum,
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
        className="flex-1 bg-black/60 justify-end"
      >
        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl max-h-[88%] border-t border-input-border dark:border-input-border-dark flex-col">
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
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {/* First & Last Name */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark mb-1">
                  First Name
                </Text>
                <TextInput
                  value={firstName}
                  onChangeText={(val) => setFirstName(capitalizeWords(val))}
                  placeholder="First name"
                  placeholderTextColor={colors.textMuted}
                  className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-xl px-3.5 py-2.5 text-sm font-semibold text-text-primary dark:text-text-primary-dark"
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark mb-1">
                  Last Name
                </Text>
                <TextInput
                  value={lastName}
                  onChangeText={(val) => setLastName(capitalizeWords(val))}
                  placeholder="Last name"
                  placeholderTextColor={colors.textMuted}
                  className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-xl px-3.5 py-2.5 text-sm font-semibold text-text-primary dark:text-text-primary-dark"
                />
              </View>
            </View>

            {/* Height & Weight */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark mb-1">
                  Height (cm)
                </Text>
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  placeholder="e.g. 175"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textMuted}
                  className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-xl px-3.5 py-2.5 text-sm font-semibold text-text-primary dark:text-text-primary-dark"
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark mb-1">
                  Weight (kg)
                </Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="e.g. 70"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textMuted}
                  className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-xl px-3.5 py-2.5 text-sm font-semibold text-text-primary dark:text-text-primary-dark"
                />
              </View>
            </View>

            {/* Age */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark mb-1">
                Age
              </Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                placeholder="e.g. 24"
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
                className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-xl px-3.5 py-2.5 text-sm font-semibold text-text-primary dark:text-text-primary-dark"
              />
            </View>

            {/* Fitness Goal Toggle */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark mb-2">
                Primary Fitness Goal
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    hapticFeedback.light();
                    setGoal('muscle');
                  }}
                  className={`flex-1 py-3 px-3 rounded-xl border flex-row items-center justify-center gap-2 ${
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
                    Muscle Gain
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    hapticFeedback.light();
                    setGoal('loss');
                  }}
                  className={`flex-1 py-3 px-3 rounded-xl border flex-row items-center justify-center gap-2 ${
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
                    Weight Loss
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={saving}
              onPress={handleSave}
              className="w-full py-3.5 rounded-xl bg-accent dark:bg-accent-dark items-center justify-center shadow-md flex-row"
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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
