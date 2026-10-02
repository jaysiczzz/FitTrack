import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { hapticFeedback } from '@/utils/haptics';
import { useWorkoutTimer } from '@/context/WorkoutTimerContext';

export interface RestTimerDockProps {
  visible?: boolean;
  initialSeconds?: number;
  exerciseName?: string;
  onClose?: () => void;
  onTimerComplete?: () => void;
}

export default function RestTimerDock(props?: RestTimerDockProps) {
  const context = useWorkoutTimer();
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  // Determine active values (context is source of truth, props provide fallback/override)
  const isVisible = props?.visible !== undefined ? props.visible : context.visible;
  const secondsLeft = context.secondsLeft;
  const totalSeconds = context.totalSeconds;
  const isRunning = context.isRunning;
  const isCompleted = context.isCompleted;
  const isMinimized = context.isMinimized;
  const exerciseName = props?.exerciseName || context.exerciseName;

  // Hide dock if inside auth routes
  if (!pathname || pathname.includes('auth')) {
    return null;
  }

  if (!isVisible) return null;

  const bottomPosition = Math.max(12, insets.bottom) + 68;

  const handleTogglePlayPause = () => {
    context.togglePlayPause();
  };

  const handleAdd30 = () => {
    context.addSeconds(30);
  };

  const handleSubtract15 = () => {
    context.subtractSeconds(15);
  };

  const handleStopAndClose = () => {
    context.stopRestTimer();
    props?.onClose?.();
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 ? Math.min(100, Math.max(0, ((totalSeconds - secondsLeft) / totalSeconds) * 100)) : 0;

  // Minimized Pill view — anchored to bottom-left to avoid colliding with FloatingAiCoachButton on bottom-right
  if (isMinimized) {
    return (
      <View
        pointerEvents="box-none"
        style={[styles.minimizedContainer, { bottom: bottomPosition }]}
      >
        <TouchableOpacity
          onPress={() => {
            hapticFeedback.light();
            context.setIsMinimized(false);
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Rest timer: ${isCompleted ? 'Ready' : formatTime(secondsLeft)}. Tap to expand.`}
          style={[
            Platform.select({
              web: {
                boxShadow: isCompleted
                  ? '0 4px 18px rgba(16, 185, 129, 0.38)'
                  : '0 4px 18px rgba(0, 0, 0, 0.35)',
              } as any,
              default: {
                elevation: 12,
              },
            }),
          ]}
          className={`flex-row items-center px-4 py-2.5 rounded-full border min-h-[44px] ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-400'
              : 'bg-zinc-900 border-accent/50 dark:border-accent-dark/50'
          }`}
        >
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : isRunning ? 'timer' : 'pause-circle'}
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 6 }}
          />
          <Text className="text-white font-extrabold text-sm font-mono tracking-tight">
            {isCompleted ? 'Ready!' : formatTime(secondsLeft)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Expanded Dock view — sits cleanly above the floating navbar
  return (
    <View
      pointerEvents="box-none"
      style={[styles.expandedContainer, { bottom: bottomPosition }]}
    >
      <View
        style={[
          Platform.select({
            web: {
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
            } as any,
            default: {
              elevation: 16,
            },
          }),
        ]}
        className={`rounded-3xl p-4 border ${
          isCompleted
            ? 'bg-emerald-950/95 border-emerald-500/60'
            : isDark
            ? 'bg-zinc-900/95 border-zinc-700/80'
            : 'bg-zinc-900/95 border-zinc-700/60'
        }`}
      >
        {/* Header row: Exercise context & minimize / close */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1 pr-2">
            <View
              className={`w-7 h-7 rounded-full items-center justify-center mr-2 ${
                isCompleted ? 'bg-emerald-500/20' : 'bg-accent/20'
              }`}
            >
              <Ionicons
                name={isCompleted ? 'checkmark' : 'timer-outline'}
                size={16}
                color={colors.accent}
              />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {isCompleted ? 'REST COMPLETED' : 'ACTIVE REST TIMER'}
              </Text>
              {exerciseName ? (
                <Text
                  className="text-xs font-semibold text-zinc-200"
                  numberOfLines={1}
                >
                  {exerciseName}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Action icons */}
          <View className="flex-row items-center gap-1.5">
            <TouchableOpacity
              onPress={() => {
                hapticFeedback.light();
                context.setIsMinimized(true);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center min-h-[32px] min-w-[32px]"
              accessibilityLabel="Minimize rest timer"
            >
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleStopAndClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center min-h-[32px] min-w-[32px]"
              accessibilityLabel="Close rest timer"
            >
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress line */}
        <View className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
          <View
            className={`h-full rounded-full ${
              isCompleted ? 'bg-emerald-400' : 'bg-accent'
            }`}
            style={{ width: `${isCompleted ? 100 : progressPercent}%` }}
          />
        </View>

        {/* Main Countdown Display & Action Controls */}
        <View className="flex-row items-center justify-between">
          {/* Large Digital Clock */}
          <View>
            <Text
              className={`text-3xl font-black font-mono tracking-tighter ${
                isCompleted ? 'text-emerald-400' : 'text-white'
              }`}
            >
              {formatTime(secondsLeft)}
            </Text>
            <Text className="text-[11px] font-medium text-zinc-400">
              {isCompleted
                ? 'Time for your next set!'
                : isRunning
                ? 'Take deep breaths & hydrate'
                : 'Timer paused'}
            </Text>
          </View>

          {/* Controls: -15s, Play/Pause, +30s */}
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={handleSubtract15}
              activeOpacity={0.7}
              disabled={isCompleted || secondsLeft <= 0}
              className={`px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl border border-zinc-700 bg-zinc-800 items-center justify-center ${
                isCompleted || secondsLeft <= 0 ? 'opacity-40' : 'active:opacity-80'
              }`}
            >
              <Text className="text-zinc-300 font-bold text-xs">-15s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTogglePlayPause}
              activeOpacity={0.8}
              className={`w-12 h-12 rounded-2xl items-center justify-center min-h-[44px] min-w-[44px] ${
                isCompleted
                  ? 'bg-emerald-500'
                  : isRunning
                  ? 'bg-accent'
                  : 'bg-amber-500'
              }`}
            >
              <Ionicons
                name={
                  isCompleted
                    ? 'refresh'
                    : isRunning
                    ? 'pause'
                    : 'play'
                }
                size={22}
                color={colors.accentContrast}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAdd30}
              activeOpacity={0.7}
              className="px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl border border-zinc-700 bg-zinc-800 items-center justify-center active:opacity-80"
            >
              <Text className="text-zinc-300 font-bold text-xs">+30s</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  minimizedContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 990,
  },
  expandedContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
});
