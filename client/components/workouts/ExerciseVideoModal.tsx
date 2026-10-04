import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { LibraryExercise } from './workoutTypes';
import ModalCloseButton from '../ui/ModalCloseButton';

interface ExerciseVideoModalProps {
  visible: boolean;
  exercise: LibraryExercise | null;
  onClose: () => void;
}

export default function ExerciseVideoModal({
  visible,
  exercise,
  onClose,
}: ExerciseVideoModalProps) {
  const { colors } = useThemeColors();

  if (!exercise) return null;

  const handleOpenYouTube = async () => {
    const cleanName = (exercise.name || '')
      .replace(/\(.*?\)/g, '')
      .replace(/[\/\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const query = `${cleanName} proper form exercise tutorial`;
    const webUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      await Linking.openURL(webUrl);
    } catch {
      if (typeof window !== 'undefined') {
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const tempoStr = exercise.recommendedTempo || '2-0-1-0';
  const tempoParts = tempoStr.split('-');
  const eccentric = tempoParts[0] || '2';
  const pauseBottom = tempoParts[1] || '0';
  const concentric = tempoParts[2] || '1';
  const pauseTop = tempoParts[3] || '0';

  const formTips = Array.isArray(exercise.formTips) ? exercise.formTips : [];
  const commonMistakes = Array.isArray(exercise.commonMistakes) ? exercise.commonMistakes : [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/75 justify-end">
        <View className="bg-background dark:bg-background-dark rounded-t-3xl max-h-[85%] border-t border-input-border dark:border-input-border-dark overflow-hidden">
          {/* Header */}
          <View className="px-5 py-4 border-b border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center gap-1.5 mb-0.5">
                <Ionicons name="play-circle" size={16} color="#EF4444" />
                <Text className="text-xs font-black text-danger dark:text-danger-dark uppercase tracking-wider">
                  Video & Form Coaching
                </Text>
              </View>
              <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark" numberOfLines={1}>
                {exercise.name}
              </Text>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          <ScrollView className="p-5" contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Primary Action: Launch Video Tutorials */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenYouTube}
              className="bg-red-600 dark:bg-red-700 p-4 rounded-2xl flex-row items-center justify-between mb-4 shadow-md"
            >
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="w-11 h-11 rounded-xl bg-white/20 items-center justify-center">
                  <Ionicons name="logo-youtube" size={24} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-black text-sm">
                    Watch Verified Form Guide
                  </Text>
                  <Text className="text-white/80 text-xs">
                    HD form tutorials from top certified coaches
                  </Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Rep Tempo & Cadence Metronome Guide */}
            <View className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="speedometer-outline" size={16} color={colors.accent} />
                  <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
                    Recommended Rep Tempo: {tempoStr}
                  </Text>
                </View>
                <View className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/25">
                  <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                    Hypertrophy Pace
                  </Text>
                </View>
              </View>

              <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-4 mb-3">
                Controlling each repetition with strict tempo ensures maximum mechanical tension and protects joints.
              </Text>

              <View className="flex-row items-center justify-between gap-1.5">
                <View className="flex-1 p-2 rounded-xl bg-input dark:bg-input-dark items-center">
                  <Text className="text-base font-black text-sky-500">
                    {eccentric}s
                  </Text>
                  <Text className="text-[9px] font-bold text-text-muted text-center">
                    ⬇️ Lowering
                  </Text>
                </View>

                <View className="flex-1 p-2 rounded-xl bg-input dark:bg-input-dark items-center">
                  <Text className="text-base font-black text-amber-500">
                    {pauseBottom}s
                  </Text>
                  <Text className="text-[9px] font-bold text-text-muted text-center">
                    ⏸️ Stretch Pause
                  </Text>
                </View>

                <View className="flex-1 p-2 rounded-xl bg-input dark:bg-input-dark items-center">
                  <Text className="text-base font-black text-emerald-500">
                    {concentric}s
                  </Text>
                  <Text className="text-[9px] font-bold text-text-muted text-center">
                    ⬆️ Explode Drive
                  </Text>
                </View>

                <View className="flex-1 p-2 rounded-xl bg-input dark:bg-input-dark items-center">
                  <Text className="text-base font-black text-purple-500">
                    {pauseTop}s
                  </Text>
                  <Text className="text-[9px] font-bold text-text-muted text-center">
                    🔄 Peak Contraction
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Trainer Cues */}
            {formTips.length > 0 && (
              <View className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark mb-4">
                <Text className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider mb-2.5">
                  ✓ Golden Execution Cues
                </Text>
                <View className="gap-2">
                  {formTips.map((tip, idx) => (
                    <View key={idx} className="flex-row items-start gap-2">
                      <Ionicons name="checkmark-circle" size={15} color="#10B981" style={{ marginTop: 1 }} />
                      <Text className="text-xs text-text-primary dark:text-text-primary-dark flex-1 leading-4 font-medium">
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Common Mistakes */}
            {commonMistakes.length > 0 && (
              <View className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark mb-4">
                <Text className="text-xs font-bold text-danger dark:text-danger-dark uppercase tracking-wider mb-2.5">
                  ✕ Dangerous Mistakes to Avoid
                </Text>
                <View className="gap-2">
                  {commonMistakes.map((mistake, idx) => (
                    <View key={idx} className="flex-row items-start gap-2">
                      <Ionicons name="alert-circle" size={15} color="#EF4444" style={{ marginTop: 1 }} />
                      <Text className="text-xs text-text-muted dark:text-text-muted-dark flex-1 leading-4">
                        {mistake}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
