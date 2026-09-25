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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import ModalCloseButton from '../ui/ModalCloseButton';

interface LogWeightModalProps {
  visible: boolean;
  onClose: () => void;
  currentWeight?: number;
  onSaveWeight: (weight: number, date: string, notes?: string) => Promise<void>;
}

const QUICK_NOTES = ['Fasted morning', 'Post-workout', 'Evening check', 'Weekly milestone'];

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

export default function LogWeightModal({
  visible,
  onClose,
  currentWeight = 70,
  onSaveWeight,
}: LogWeightModalProps) {
  const { colors } = useThemeColors();
  const { showWarning } = useToast();

  const [weightInput, setWeightInput] = useState<string>(String(currentWeight));
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [dateMode, setDateMode] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setWeightInput(currentWeight ? currentWeight.toFixed(1) : '70.0');
      setSelectedDate(getLocalDateString());
      setDateMode('today');
      setNotes('');
    }
  }, [visible, currentWeight]);

  const handleAdjust = (delta: number) => {
    const val = parseFloat(weightInput) || currentWeight || 70;
    const nextVal = Math.max(20, Math.min(350, val + delta));
    setWeightInput(nextVal.toFixed(1));
  };

  const handleSelectDateMode = (mode: 'today' | 'yesterday' | 'custom') => {
    setDateMode(mode);
    if (mode === 'today') {
      setSelectedDate(getLocalDateString());
    } else if (mode === 'yesterday') {
      setSelectedDate(getYesterdayDateString());
    }
  };

  const handleSubmit = async () => {
    const wNum = parseFloat(weightInput);
    if (isNaN(wNum) || wNum <= 20 || wNum > 400) {
      showWarning('Invalid Weight', 'Please enter a valid body weight between 20 and 400 kg.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      showWarning('Invalid Date', 'Date must be in YYYY-MM-DD format.');
      return;
    }

    setSaving(true);
    try {
      await onSaveWeight(Number(wNum.toFixed(1)), selectedDate, notes.trim() || undefined);
      onClose();
    } catch (err) {
      // Error handled by caller toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl p-5 border-t border-input-border dark:border-input-border-dark max-h-[92%] shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
            <View>
              <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark">
                Log Weigh-In ⚖️
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Record your daily body weight to track trends
              </Text>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
            {/* Date Selection Mode */}
            <View className="mb-4">
              <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted dark:text-text-muted-dark mb-2">
                Weigh-In Date
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => handleSelectDateMode('today')}
                  activeOpacity={0.7}
                  className={`flex-1 py-2 rounded-xl items-center border ${
                    dateMode === 'today'
                      ? 'bg-accent/15 border-accent dark:border-accent-dark'
                      : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      dateMode === 'today'
                        ? 'text-accent dark:text-accent-dark'
                        : 'text-text-muted dark:text-text-muted-dark'
                    }`}
                  >
                    Today
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSelectDateMode('yesterday')}
                  activeOpacity={0.7}
                  className={`flex-1 py-2 rounded-xl items-center border ${
                    dateMode === 'yesterday'
                      ? 'bg-accent/15 border-accent dark:border-accent-dark'
                      : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      dateMode === 'yesterday'
                        ? 'text-accent dark:text-accent-dark'
                        : 'text-text-muted dark:text-text-muted-dark'
                    }`}
                  >
                    Yesterday
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSelectDateMode('custom')}
                  activeOpacity={0.7}
                  className={`flex-1 py-2 rounded-xl items-center border ${
                    dateMode === 'custom'
                      ? 'bg-accent/15 border-accent dark:border-accent-dark'
                      : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      dateMode === 'custom'
                        ? 'text-accent dark:text-accent-dark'
                        : 'text-text-muted dark:text-text-muted-dark'
                    }`}
                  >
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>

              {dateMode === 'custom' && (
                <View className="mt-2.5 bg-input dark:bg-input-dark p-2.5 rounded-xl border border-input-border dark:border-input-border-dark">
                  <Text className="text-[10px] text-text-muted dark:text-text-muted-dark mb-1">
                    Enter date (YYYY-MM-DD):
                  </Text>
                  <TextInput
                    value={selectedDate}
                    onChangeText={setSelectedDate}
                    placeholder="2026-09-25"
                    placeholderTextColor={colors.textMuted}
                    className="text-xs text-text-primary dark:text-text-primary-dark font-bold py-1"
                  />
                </View>
              )}
            </View>

            {/* Main Weight Input with Rapid Steppers */}
            <View className="mb-4 items-center bg-input/40 dark:bg-input-dark/40 p-4 rounded-2xl border border-input-border dark:border-input-border-dark">
              <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted dark:text-text-muted-dark mb-1">
                Body Weight
              </Text>

              <View className="flex-row items-baseline justify-center mb-3">
                <TextInput
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="decimal-pad"
                  className="text-4xl font-black text-text-primary dark:text-text-primary-dark text-center min-w-[120px]"
                  selectTextOnFocus
                />
                <Text className="text-xl font-bold text-accent dark:text-accent-dark ml-1">
                  kg
                </Text>
              </View>

              {/* Stepper Buttons Row */}
              <View className="flex-row items-center justify-center gap-2">
                <TouchableOpacity
                  onPress={() => handleAdjust(-1.0)}
                  activeOpacity={0.7}
                  className="px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
                >
                  <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                    -1.0
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleAdjust(-0.1)}
                  activeOpacity={0.7}
                  className="px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
                >
                  <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                    -0.1
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleAdjust(+0.1)}
                  activeOpacity={0.7}
                  className="px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
                >
                  <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                    +0.1
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleAdjust(+1.0)}
                  activeOpacity={0.7}
                  className="px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
                >
                  <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                    +1.0
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Optional Reflection Note & Chips */}
            <View className="mb-5">
              <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted dark:text-text-muted-dark mb-1.5">
                Weigh-In Condition (Optional)
              </Text>
              <View className="flex-row flex-wrap gap-1.5 mb-2">
                {QUICK_NOTES.map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    onPress={() => setNotes(chip)}
                    activeOpacity={0.7}
                    className={`px-2.5 py-1 rounded-full border ${
                      notes === chip
                        ? 'bg-accent/15 border-accent dark:border-accent-dark'
                        : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-semibold ${
                        notes === chip
                          ? 'text-accent dark:text-accent-dark'
                          : 'text-text-muted dark:text-text-muted-dark'
                      }`}
                    >
                      {chip}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. After morning cardio, feeling light"
                placeholderTextColor={colors.textMuted}
                maxLength={200}
                className="bg-input dark:bg-input-dark p-3 rounded-2xl text-text-primary dark:text-text-primary-dark text-xs border border-input-border dark:border-input-border-dark"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.8}
              className="w-full bg-accent dark:bg-accent-dark py-3.5 rounded-2xl items-center justify-center flex-row shadow-sm mb-4"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" className="mr-1.5" />
              )}
              <Text className="text-white font-bold text-sm">
                Save Weigh-In
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
