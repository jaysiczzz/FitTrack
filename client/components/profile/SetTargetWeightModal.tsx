import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import ModalCloseButton from '../ui/ModalCloseButton';

interface SetTargetWeightModalProps {
  visible: boolean;
  onClose: () => void;
  currentTargetWeight: number | null;
  currentWeight: number;
  goal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS';
  onSaveTarget: (targetWeight: number | null) => Promise<void>;
}

export default function SetTargetWeightModal({
  visible,
  onClose,
  currentTargetWeight,
  currentWeight = 70,
  goal = 'WEIGHT_LOSS',
  onSaveTarget,
}: SetTargetWeightModalProps) {
  const { colors } = useThemeColors();
  const { showWarning } = useToast();

  const [inputVal, setInputVal] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (currentTargetWeight) {
        setInputVal(currentTargetWeight.toFixed(1));
      } else {
        const suggested = goal === 'WEIGHT_LOSS' ? Math.max(30, currentWeight - 5) : currentWeight + 3;
        setInputVal(suggested.toFixed(1));
      }
    }
  }, [visible, currentTargetWeight, currentWeight, goal]);

  const handleAdjust = (delta: number) => {
    const val = parseFloat(inputVal) || currentWeight;
    const nextVal = Math.max(30, Math.min(300, val + delta));
    setInputVal(nextVal.toFixed(1));
  };

  const handleSave = async () => {
    const num = parseFloat(inputVal);
    if (isNaN(num) || num <= 20 || num > 400) {
      showWarning('Invalid Target', 'Please enter a target weight between 20 and 400 kg.');
      return;
    }

    setSaving(true);
    try {
      await onSaveTarget(Number(num.toFixed(1)));
      onClose();
    } catch {
      // Handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await onSaveTarget(null);
      onClose();
    } catch {
      // Handled by parent
    } finally {
      setSaving(false);
    }
  };

  const targetNum = parseFloat(inputVal);
  const diffKg = !isNaN(targetNum) ? Math.abs(currentWeight - targetNum) : 0;
  const estimatedWeeks = Math.max(1, Math.round(diffKg / 0.5)); // 0.5 kg/week healthy pace

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl p-5 border-t border-input-border dark:border-input-border-dark shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
            <View>
              <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark">
                Target Weight Goal 🎯
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Set a realistic target milestone to track progress
              </Text>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          <View className="my-5 items-center bg-input/40 dark:bg-input-dark/40 p-4 rounded-2xl border border-input-border dark:border-input-border-dark">
            <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted dark:text-text-muted-dark mb-1">
              Target Goal
            </Text>

            <View className="flex-row items-baseline justify-center mb-3">
              <TextInput
                value={inputVal}
                onChangeText={setInputVal}
                keyboardType="decimal-pad"
                className="text-4xl font-black text-text-primary dark:text-text-primary-dark text-center min-w-[120px]"
                selectTextOnFocus
              />
              <Text className="text-xl font-bold text-accent dark:text-accent-dark ml-1">
                kg
              </Text>
            </View>

            {/* Steppers */}
            <View className="flex-row items-center justify-center gap-2">
              <TouchableOpacity
                onPress={() => handleAdjust(-2.0)}
                activeOpacity={0.7}
                className="px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
              >
                <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                  -2.0
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAdjust(-0.5)}
                activeOpacity={0.7}
                className="px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
              >
                <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                  -0.5
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAdjust(+0.5)}
                activeOpacity={0.7}
                className="px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
              >
                <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                  +0.5
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAdjust(+2.0)}
                activeOpacity={0.7}
                className="px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
              >
                <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                  +2.0
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Goal Insight Box */}
          {!isNaN(targetNum) && diffKg > 0 && (
            <View className="mb-5 p-3 rounded-2xl bg-accent/10 border border-accent/25 flex-row items-center">
              <Ionicons name="sparkles" size={18} color="#10B981" style={{ marginRight: 10 }} />
              <View className="flex-1">
                <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                  {diffKg.toFixed(1)} kg {goal === 'WEIGHT_LOSS' ? 'to lose' : 'to gain'}
                </Text>
                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
                  At a sustainable ~0.5kg/week rate, this goal is achievable in approximately {estimatedWeeks} {estimatedWeeks === 1 ? 'week' : 'weeks'}.
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-col gap-2 mb-2">
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
              className="w-full bg-accent dark:bg-accent-dark py-3.5 rounded-2xl items-center justify-center flex-row shadow-sm"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" className="mr-1.5" />
              )}
              <Text className="text-white font-bold text-sm">
                Save Target Goal
              </Text>
            </TouchableOpacity>

            {currentTargetWeight !== null && (
              <TouchableOpacity
                onPress={handleClear}
                disabled={saving}
                activeOpacity={0.8}
                className="w-full py-2.5 rounded-2xl items-center justify-center"
              >
                <Text className="text-danger dark:text-danger-dark font-semibold text-xs">
                  Remove Target Goal
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
