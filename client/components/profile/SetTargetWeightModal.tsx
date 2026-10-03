import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { useWeightUnit, convertFromKg, convertToKg } from '@/constants/units';
import ModalCloseButton from '../ui/ModalCloseButton';
import ModalErrorBanner from '../ui/ModalErrorBanner';

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
  const [unit] = useWeightUnit();
  const isLbs = unit === 'LBS';
  const unitLabel = unit.toLowerCase();

  const [inputVal, setInputVal] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setTargetError(null);
      if (currentTargetWeight) {
        setInputVal(convertFromKg(currentTargetWeight, unit).toFixed(1));
      } else {
        const curConverted = convertFromKg(currentWeight, unit);
        const delta = isLbs ? 10 : 5;
        const minVal = isLbs ? 66 : 30;
        const suggested = goal === 'WEIGHT_LOSS' ? Math.max(minVal, curConverted - delta) : curConverted + (isLbs ? 6 : 3);
        setInputVal(suggested.toFixed(1));
      }
    }
  }, [visible, currentTargetWeight, currentWeight, goal, unit, isLbs]);

  const handleAdjust = (delta: number) => {
    setTargetError(null);
    const minW = isLbs ? 66 : 30;
    const maxW = isLbs ? 660 : 300;
    const fallback = isLbs ? 154 : 70;
    const val = parseFloat(inputVal) || fallback;
    const nextVal = Math.max(minW, Math.min(maxW, val + delta));
    setInputVal(nextVal.toFixed(1));
  };

  const handleSave = async () => {
    setTargetError(null);
    const num = parseFloat(inputVal);
    const minW = isLbs ? 45 : 20;
    const maxW = isLbs ? 880 : 400;
    if (isNaN(num) || num < minW || num > maxW) {
      setTargetError(`Please enter a target weight between ${minW} and ${maxW} ${unitLabel}.`);
      return;
    }

    setSaving(true);
    try {
      const targetKg = isLbs ? convertToKg(num, 'LBS') : num;
      await onSaveTarget(Number(targetKg.toFixed(1)));
      setTargetError(null);
      onClose();
    } catch (err: any) {
      setTargetError(err?.message || 'Could not update target weight. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setTargetError(null);
    setSaving(true);
    try {
      await onSaveTarget(null);
      setTargetError(null);
      onClose();
    } catch (err: any) {
      setTargetError(err?.message || 'Could not clear target weight.');
    } finally {
      setSaving(false);
    }
  };

  const targetNum = parseFloat(inputVal);
  const curConverted = convertFromKg(currentWeight, unit);
  const diffInUnit = !isNaN(targetNum) ? Math.abs(curConverted - targetNum) : 0;
  const weeklyPace = isLbs ? 1.0 : 0.5; // ~1 lb/week or ~0.5 kg/week healthy pace
  const estimatedWeeks = Math.max(1, Math.round(diffInUnit / weeklyPace));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 justify-end md:justify-center md:items-center bg-black/50 p-0 md:p-4"
      >
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl md:rounded-3xl p-5 border-t md:border border-input-border dark:border-input-border-dark w-full md:max-w-lg shadow-2xl">
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

          {/* Inline Error Banner */}
          <ModalErrorBanner
            error={targetError}
            onDismiss={() => setTargetError(null)}
            className="mt-3 mb-0"
          />

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
                {unitLabel}
              </Text>
            </View>

            {/* Steppers */}
            <View className="flex-row items-center justify-center gap-2">
              <TouchableOpacity
                onPress={() => handleAdjust(isLbs ? -4.0 : -2.0)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                className="px-3.5 min-h-[44px] rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark justify-center items-center"
              >
                <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                  {isLbs ? '-4.0' : '-2.0'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAdjust(isLbs ? -1.0 : -0.5)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                className="px-3.5 min-h-[44px] rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark justify-center items-center"
              >
                <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                  {isLbs ? '-1.0' : '-0.5'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAdjust(isLbs ? +1.0 : +0.5)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                className="px-3.5 min-h-[44px] rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark justify-center items-center"
              >
                <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                  {isLbs ? '+1.0' : '+0.5'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAdjust(isLbs ? +4.0 : +2.0)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                className="px-3.5 min-h-[44px] rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark justify-center items-center"
              >
                <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                  {isLbs ? '+4.0' : '+2.0'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Goal Insight Box */}
          {!isNaN(targetNum) && diffInUnit > 0 && (
            <View className="mb-5 p-3 rounded-2xl bg-accent/10 border border-accent/25 flex-row items-center">
              <Ionicons name="sparkles" size={18} color="#10B981" style={{ marginRight: 10 }} />
              <View className="flex-1">
                <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                  {diffInUnit.toFixed(1)} {unitLabel} {goal === 'WEIGHT_LOSS' ? 'to lose' : 'to gain'}
                </Text>
                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
                  At a sustainable ~{weeklyPace}{unitLabel}/week rate, this goal is achievable in approximately {estimatedWeeks} {estimatedWeeks === 1 ? 'week' : 'weeks'}.
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
              className="w-full bg-accent dark:bg-accent-dark min-h-[48px] py-3.5 rounded-2xl items-center justify-center flex-row shadow-sm"
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
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-full min-h-[44px] py-2.5 rounded-2xl items-center justify-center"
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
