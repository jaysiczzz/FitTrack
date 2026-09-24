import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import ModalCloseButton from '../ui/ModalCloseButton';
import { parseTime, formatTimeDisplay } from '@/utils/notificationService';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  initialTime: string; // "HH:MM" e.g. "08:30"
  onSaveTime: (newTime: string) => void;
}

const HOURS_12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function TimePickerModal({
  visible,
  onClose,
  title,
  initialTime,
  onSaveTime,
}: TimePickerModalProps) {
  const { colors, isDark } = useThemeColors();

  const [selected12Hour, setSelected12Hour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(30);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    if (visible) {
      const { hour, minute } = parseTime(initialTime || '08:30');
      const period = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 === 0 ? 12 : hour % 12;
      // Round minute to nearest 5
      const m5 = Math.round(minute / 5) * 5 % 60;

      setSelected12Hour(h12);
      setSelectedMinute(m5);
      setSelectedPeriod(period);
    }
  }, [visible, initialTime]);

  const handleSave = () => {
    let hour24 = selected12Hour % 12;
    if (selectedPeriod === 'PM') {
      hour24 += 12;
    }
    const hh = String(hour24).padStart(2, '0');
    const mm = String(selectedMinute).padStart(2, '0');
    onSaveTime(`${hh}:${mm}`);
    onClose();
  };

  const previewFormatted = `${selected12Hour}:${String(selectedMinute).padStart(2, '0')} ${selectedPeriod}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl p-5 border-t border-input-border dark:border-input-border-dark shadow-2xl max-h-[85%]">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
            <View>
              <Text className="text-base font-black text-text-primary dark:text-text-primary-dark">
                {title}
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Set custom reminder schedule
              </Text>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          {/* Time Preview Badge */}
          <View className="my-4 items-center justify-center p-3.5 bg-accent/10 dark:bg-accent-dark/15 border border-accent/30 dark:border-accent-dark/30 rounded-2xl">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-accent dark:text-accent-dark mb-1">
              Scheduled Reminder Time
            </Text>
            <Text className="text-3xl font-black text-text-primary dark:text-text-primary-dark tracking-tight">
              {previewFormatted}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
            {/* AM / PM Toggle */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-2">
                Time of Day
              </Text>
              <View className="flex-row bg-input dark:bg-input-dark p-1 rounded-2xl border border-input-border dark:border-input-border-dark">
                <TouchableOpacity
                  onPress={() => setSelectedPeriod('AM')}
                  className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
                    selectedPeriod === 'AM'
                      ? 'bg-accent dark:bg-accent-dark shadow-xs'
                      : 'bg-transparent'
                  }`}
                >
                  <Text
                    className={`text-xs font-black ${
                      selectedPeriod === 'AM' ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'
                    }`}
                  >
                    AM (Morning)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedPeriod('PM')}
                  className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
                    selectedPeriod === 'PM'
                      ? 'bg-accent dark:bg-accent-dark shadow-xs'
                      : 'bg-transparent'
                  }`}
                >
                  <Text
                    className={`text-xs font-black ${
                      selectedPeriod === 'PM' ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'
                    }`}
                  >
                    PM (Afternoon / Evening)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Hour Selector (1-12) */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-2">
                Hour
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {HOURS_12.map((h) => {
                  const isSelected = selected12Hour === h;
                  return (
                    <TouchableOpacity
                      key={h}
                      activeOpacity={0.8}
                      onPress={() => setSelected12Hour(h)}
                      className={`w-[22%] py-2.5 rounded-xl items-center justify-center border ${
                        isSelected
                          ? 'bg-accent/15 border-accent dark:border-accent-dark shadow-2xs'
                          : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                      }`}
                    >
                      <Text
                        className={`text-sm font-black ${
                          isSelected ? 'text-accent dark:text-accent-dark' : 'text-text-primary dark:text-text-primary-dark'
                        }`}
                      >
                        {h}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Minute Selector (00 to 55 by 5s) */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-2">
                Minute
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {MINUTES.map((m) => {
                  const isSelected = selectedMinute === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      activeOpacity={0.8}
                      onPress={() => setSelectedMinute(m)}
                      className={`w-[22%] py-2 rounded-xl items-center justify-center border ${
                        isSelected
                          ? 'bg-accent/15 border-accent dark:border-accent-dark shadow-2xs'
                          : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                      }`}
                    >
                      <Text
                        className={`text-xs font-black ${
                          isSelected ? 'text-accent dark:text-accent-dark' : 'text-text-muted dark:text-text-muted-dark'
                        }`}
                      >
                        :{String(m).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="flex-row gap-2 pt-2 border-t border-input-border dark:border-input-border-dark">
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              className="flex-1 py-3 rounded-2xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
            >
              <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.9}
              className="flex-1 py-3 rounded-2xl bg-accent dark:bg-accent-dark items-center justify-center shadow-md shadow-accent/20"
            >
              <Text className="text-xs font-black text-white uppercase tracking-wider">
                Apply Time
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
