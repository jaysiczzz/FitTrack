import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import { hapticFeedback } from '@/utils/haptics';
import SurfaceCard from '../ui/SurfaceCard';
import { QUICK_START_STEPS, QuickStartContext, QuickStartHandlers } from './quickStartConfig';

export interface QuickStartGuideCardProps {
  isCheckedIn: boolean;
  hasLoggedMeal: boolean;
  hasLoggedWorkout: boolean;
  onCheckInPress: () => void;
  onLogMealPress: () => void;
  onWorkoutPress: () => void;
  onAiCoachPress: () => void;
  onActiveStateChange?: (isActive: boolean) => void;
}

export default function QuickStartGuideCard({
  isCheckedIn,
  hasLoggedMeal,
  hasLoggedWorkout,
  onCheckInPress,
  onLogMealPress,
  onWorkoutPress,
  onAiCoachPress,
  onActiveStateChange,
}: QuickStartGuideCardProps) {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const userId = user?.id;

  const storageKey = authStorage.getScopedKey(userId, 'quick_start_guide_dismissed');
  const manualStep3Key = authStorage.getScopedKey(userId, 'quick_start_step3_completed');

  const [isDismissed, setIsDismissed] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [manualStep3Done, setManualStep3Done] = useState(false);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  // Check storage on mount & listen for re-activation
  useEffect(() => {
    let isMounted = true;

    async function checkDismissed() {
      if (!userId) return;
      try {
        const [dismissedVal, step3Val] = await Promise.all([
          AsyncStorage.getItem(storageKey),
          AsyncStorage.getItem(manualStep3Key),
        ]);
        if (isMounted) {
          setIsDismissed(dismissedVal === 'true');
          setManualStep3Done(step3Val === 'true');
          setIsStorageLoaded(true);
        }
      } catch (err) {
        console.warn('Could not read quick start guide storage:', err);
      }
    }

    checkDismissed();

    const subReset = DeviceEventEmitter.addListener('RESET_QUICK_START_GUIDE', () => {
      setIsDismissed(false);
      setIsCollapsed(false);
    });

    return () => {
      isMounted = false;
      subReset.remove();
    };
  }, [userId, storageKey, manualStep3Key]);

  // Handle Step 3 (Workout or AI Coach) completion
  const step3Completed = hasLoggedWorkout || manualStep3Done;

  // Build reactive context for config evaluation
  const ctx: QuickStartContext = useMemo(
    () => ({
      isCheckedIn,
      hasLoggedMeal,
      hasLoggedWorkout,
      step3Completed,
    }),
    [isCheckedIn, hasLoggedMeal, hasLoggedWorkout, step3Completed]
  );

  // Build action handlers (preserving manualStep3Done persistence)
  const handlers: QuickStartHandlers = useMemo(
    () => ({
      onCheckInPress,
      onLogMealPress,
      onWorkoutPress: () => {
        hapticFeedback.light();
        setManualStep3Done(true);
        if (userId) {
          AsyncStorage.setItem(manualStep3Key, 'true').catch(() => {});
        }
        onWorkoutPress();
      },
      onAiCoachPress: () => {
        hapticFeedback.light();
        setManualStep3Done(true);
        if (userId) {
          AsyncStorage.setItem(manualStep3Key, 'true').catch(() => {});
        }
        onAiCoachPress();
      },
    }),
    [onCheckInPress, onLogMealPress, onWorkoutPress, onAiCoachPress, userId, manualStep3Key]
  );

  const totalSteps = QUICK_START_STEPS.length;

  const completedCount = useMemo(() => {
    return QUICK_START_STEPS.filter((step) => step.isCompleted(ctx)).length;
  }, [ctx]);

  const progressPct = Math.round((completedCount / totalSteps) * 100);
  const allCompleted = completedCount === totalSteps;

  // Report active state once storage has resolved
  useEffect(() => {
    if (!isStorageLoaded) return;
    const isActive = !isDismissed && !allCompleted;
    onActiveStateChange?.(isActive);
  }, [isStorageLoaded, isDismissed, allCompleted, onActiveStateChange]);

  // Report false on unmount so parent is never permanently blocked
  useEffect(() => {
    return () => {
      onActiveStateChange?.(false);
    };
  }, [onActiveStateChange]);

  const handleDismiss = useCallback(async () => {
    hapticFeedback.light();
    setIsDismissed(true);
    if (userId) {
      try {
        await AsyncStorage.setItem(storageKey, 'true');
      } catch (err) {
        console.warn('Could not persist quick start dismissal:', err);
      }
    }
  }, [userId, storageKey]);

  if (isDismissed) {
    return null;
  }

  return (
    <SurfaceCard className="mb-3 overflow-hidden border border-accent/20 dark:border-accent-dark/30 shadow-sm">
      {/* Top Banner Row */}
      <View className="flex-row items-center justify-between pb-2.5">
        <View className="flex-row items-center gap-2 flex-1 mr-2">
          <View className="w-8 h-8 rounded-xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center">
            <Ionicons name="rocket-outline" size={17} color={colors.accent} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark tracking-tight">
                Quick Start Guide
              </Text>
              <View className="px-2 py-0.5 rounded-full bg-accent/15 dark:bg-accent-dark/20 border border-accent/30 dark:border-accent-dark/30">
                <Text className="text-[10px] font-black text-accent dark:text-accent-dark">
                  {completedCount}/{totalSteps} Done
                </Text>
              </View>
            </View>
            <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
              {allCompleted
                ? 'All set! Core habits unlocked.'
                : '3 quick steps to get started'}
            </Text>
          </View>
        </View>

        {/* Right Action Icons: Collapse / Expand & Dismiss */}
        <View className="flex-row items-center gap-1">
          <TouchableOpacity
            onPress={() => {
              hapticFeedback.light();
              setIsCollapsed(!isCollapsed);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-7 h-7 rounded-lg items-center justify-center bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
            accessibilityLabel={isCollapsed ? 'Expand guide' : 'Collapse guide'}
          >
            <Ionicons
              name={isCollapsed ? 'chevron-down' : 'chevron-up'}
              size={14}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-7 h-7 rounded-lg items-center justify-center bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
            accessibilityLabel="Dismiss guide"
          >
            <Ionicons name="close" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar Track */}
      <View className="w-full h-1.5 rounded-full bg-input dark:bg-input-dark overflow-hidden mb-3">
        <View
          style={{ width: `${progressPct}%` }}
          className="h-full bg-accent dark:bg-accent-dark rounded-full transition-all duration-300"
        />
      </View>

      {/* Body: Step-by-Step Items (Collapsible) */}
      {!isCollapsed && (
        <View className="gap-2.5">
          {allCompleted ? (
            /* All Completed Celebration Notice (Compact banner replacing 3 struck rows) */
            <View className="p-3.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                <Text className="text-xl">🎯</Text>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Habits Unlocked!
                  </Text>
                  <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
                    Daily goals & habit tracking are now active below.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleDismiss}
                activeOpacity={0.8}
                className="bg-emerald-600 dark:bg-emerald-500 px-3 py-1.5 rounded-lg flex-row items-center gap-1"
              >
                <Text className="text-white text-xs font-bold">View Goals</Text>
                <Ionicons name="arrow-down" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            QUICK_START_STEPS.map((stepConfig) => {
              const isStepDone = stepConfig.isCompleted(ctx);
              return (
                <View
                  key={stepConfig.id}
                  className={`p-3 rounded-xl border flex-row items-center justify-between ${
                    isStepDone
                      ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/25'
                      : 'bg-input/60 dark:bg-input-dark/60 border-input-border dark:border-input-border-dark'
                  }`}
                >
                  <View className="flex-row items-center gap-2.5 flex-1 min-w-0 pr-2">
                    <View
                      className={`w-7 h-7 rounded-lg items-center justify-center flex-shrink-0 ${
                        isStepDone ? 'bg-emerald-500/20' : 'bg-input dark:bg-input-dark'
                      }`}
                    >
                      {isStepDone ? (
                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      ) : (
                        <Ionicons name={stepConfig.icon} size={15} color={colors.accent} />
                      )}
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text
                        className={`text-xs font-bold ${
                          isStepDone
                            ? 'text-emerald-700 dark:text-emerald-400 line-through'
                            : 'text-text-primary dark:text-text-primary-dark'
                        }`}
                      >
                        {stepConfig.title}
                      </Text>
                      <Text
                        className="text-[10px] text-text-muted dark:text-text-muted-dark leading-tight mt-0.5"
                      >
                        {isStepDone ? stepConfig.completedDescription : stepConfig.description}
                      </Text>

                      {/* Secondary Link Action (rendered inline below text) */}
                      {!isStepDone &&
                        stepConfig.actions
                          .filter((act) => act.variant === 'link')
                          .map((act) => (
                            <TouchableOpacity
                              key={act.id}
                              onPress={() => {
                                hapticFeedback.light();
                                act.onPress(handlers);
                              }}
                              hitSlop={{ top: 6, bottom: 6, left: 4, right: 6 }}
                              className="mt-1 flex-row items-center gap-0.5 self-start"
                            >
                              <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                                {act.label}
                              </Text>
                              <Ionicons name="arrow-forward" size={10} color={colors.accent} />
                            </TouchableOpacity>
                          ))}
                    </View>
                  </View>

                  {!isStepDone ? (
                    <View className="flex-shrink-0 flex-row gap-1.5 items-center">
                      {stepConfig.actions
                        .filter((act) => act.variant !== 'link')
                        .map((act) => (
                          <TouchableOpacity
                            key={act.id}
                            onPress={() => {
                              hapticFeedback.light();
                              act.onPress(handlers);
                            }}
                            activeOpacity={act.variant === 'primary' ? 0.8 : 0.7}
                            className={
                              act.variant === 'primary'
                                ? 'bg-accent dark:bg-accent-dark px-3 py-1.5 min-h-[30px] rounded-lg items-center justify-center'
                                : 'bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-2.5 py-1.5 min-h-[30px] rounded-lg items-center justify-center'
                            }
                          >
                            <Text
                              className={
                                act.variant === 'primary'
                                  ? 'text-white text-xs font-bold'
                                  : 'text-text-primary dark:text-text-primary-dark text-xs font-semibold'
                              }
                            >
                              {act.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  ) : (
                    <View className="flex-shrink-0 flex-row items-center gap-1">
                      <Ionicons name="checkmark" size={14} color="#10B981" />
                      <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Done</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </SurfaceCard>
  );
}
