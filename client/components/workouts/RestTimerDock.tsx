import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { hapticFeedback } from '@/utils/haptics';

interface RestTimerDockProps {
  visible: boolean;
  initialSeconds?: number;
  exerciseName?: string;
  onClose: () => void;
  onTimerComplete?: () => void;
}

export default function RestTimerDock({
  visible,
  initialSeconds = 90,
  exerciseName,
  onClose,
  onTimerComplete,
}: RestTimerDockProps) {
  const { colors, isDark } = useThemeColors();
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);


  // Reset timer whenever it opens with a new initialSeconds value
  useEffect(() => {
    if (visible) {
      setSecondsLeft(initialSeconds);
      setTotalSeconds(initialSeconds);
      setIsRunning(true);
      setIsCompleted(false);
      setIsMinimized(false);
      hapticFeedback.light();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible, initialSeconds]);

  // Main countdown tick effect
  useEffect(() => {
    if (!visible || !isRunning || isCompleted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsRunning(false);
          setIsCompleted(true);
          hapticFeedback.success();
          onTimerComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, isRunning, isCompleted, onTimerComplete]);

  if (!visible) return null;

  const handleTogglePlayPause = () => {
    hapticFeedback.light();
    if (isCompleted) {
      // Restart
      setSecondsLeft(totalSeconds);
      setIsCompleted(false);
      setIsRunning(true);
      return;
    }
    setIsRunning(!isRunning);
  };

  const handleAdd30 = () => {
    hapticFeedback.light();
    setSecondsLeft((prev) => {
      const next = prev + 30;
      if (next > totalSeconds) setTotalSeconds(next);
      return next;
    });
    if (isCompleted) {
      setIsCompleted(false);
      setIsRunning(true);
    }
  };

  const handleSubtract15 = () => {
    hapticFeedback.light();
    setSecondsLeft((prev) => Math.max(0, prev - 15));
  };

  const handleStopAndClose = () => {
    hapticFeedback.light();
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 ? Math.min(100, Math.max(0, ((totalSeconds - secondsLeft) / totalSeconds) * 100)) : 0;

  // Minimized Pill view
  if (isMinimized) {
    return (
      <View
        className="absolute bottom-20 right-4 z-50 shadow-xl"
        style={{ elevation: 12 }}
      >
        <TouchableOpacity
          onPress={() => {
            hapticFeedback.light();
            setIsMinimized(false);
          }}
          activeOpacity={0.85}
          className={`flex-row items-center px-3.5 py-2.5 rounded-full border ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-400'
              : 'bg-zinc-900 dark:bg-zinc-900 border-accent/40'
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

  // Expanded Dock view
  return (
    <View
      className="absolute bottom-20 left-4 right-4 z-50 shadow-2xl"
      style={{ elevation: 15 }}
    >
      <View
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
                color={isCompleted ? '#10B981' : colors.accent}
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
          <View className="flex-row items-center gap-1">
            <TouchableOpacity
              onPress={() => {
                hapticFeedback.light();
                setIsMinimized(true);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-7 h-7 rounded-full bg-zinc-800 items-center justify-center"
            >
              <Ionicons name="chevron-down" size={16} color="#A1A1AA" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleStopAndClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-7 h-7 rounded-full bg-zinc-800 items-center justify-center"
            >
              <Ionicons name="close" size={16} color="#A1A1AA" />
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
              className={`px-2.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 items-center justify-center ${
                isCompleted || secondsLeft <= 0 ? 'opacity-40' : 'active:opacity-80'
              }`}
            >
              <Text className="text-zinc-300 font-bold text-xs">-15s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTogglePlayPause}
              activeOpacity={0.8}
              className={`w-11 h-11 rounded-2xl items-center justify-center ${
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
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAdd30}
              activeOpacity={0.7}
              className="px-2.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 items-center justify-center active:opacity-80"
            >
              <Text className="text-zinc-300 font-bold text-xs">+30s</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
