import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompletedSession } from './workoutTypes';
import { getWorkoutHistory } from '@/api/workout';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import { useThemeColors } from '@/constants/colors';
import SurfaceCard from '../ui/SurfaceCard';

const WorkoutHistoryTab: React.FC = () => {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const userId = user?.id;
  const historyKey = authStorage.getScopedKey(userId, 'fittrack_workout_history_cache');

  const [history, setHistory] = useState<CompletedSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        // Read local offline history cache first
        const cached = await AsyncStorage.getItem(historyKey);
        if (cached && isMounted) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              setHistory(parsed);
            }
          } catch {}
        }

        if (history.length === 0) setLoading(true);
        const res = await getWorkoutHistory();
        if (res.sessions && isMounted) {
          const formatted: CompletedSession[] = res.sessions.map((s: any) => ({
            id: s.id,
            date: s.completedAt ? new Date(s.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Completed',
            title: s.title || 'Workout Session',
            duration: `${s.duration || 35} min`,
            caloriesBurned: s.caloriesBurned || 240,
            exercisesCount: s.exercises ? s.exercises.length : 0,
            exercises: (s.exercises || []).map((e: any) => ({
              name: e.name,
              setsSummary: `${e.sets ? e.sets.length : 0} sets`,
            })),
          }));
          setHistory(formatted);
          await AsyncStorage.setItem(historyKey, JSON.stringify(formatted));
        }
      } catch (err) {
        console.log('[Workout History] Offline mode - using local history cache');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [historyKey]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <View className="mt-1">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
          Completed Sessions ({history.length})
        </Text>
      </View>

      {loading ? (
        <View className="py-8 items-center">
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      ) : history.length === 0 ? (
        <SurfaceCard className="p-6 items-center my-4">
          <View className="w-12 h-12 rounded-2xl bg-input dark:bg-input-dark items-center justify-center mb-3">
            <Ionicons name="clipboard" size={26} color={colors.textMuted} />
          </View>
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm text-center mb-1">
            No workout history yet
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center leading-relaxed max-w-[240px]">
            Complete your first daily workout to start logging your progress history.
          </Text>
        </SurfaceCard>
      ) : (
        history.map((session) => {
          const isExpanded = expandedId === session.id;
          return (
            <SurfaceCard key={session.id} className="mb-3">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => toggleExpand(session.id)}
              >
                {/* Header: Date & Status */}
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                    {session.date}
                  </Text>
                  <View className="bg-accent/15 dark:bg-accent-dark/20 border border-accent/30 px-2.5 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-accent dark:text-accent-dark uppercase">
                      Completed
                    </Text>
                  </View>
                </View>

                {/* Session Title */}
                <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark mb-2">
                  {session.title}
                </Text>

                {/* Metrics Chips */}
                <View className="flex-row items-center gap-x-2.5 mb-3 bg-input dark:bg-input-dark p-2.5 rounded-xl border border-input-border/50 dark:border-input-border-dark/50">
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {session.duration}
                  </Text>
                  <Text className="text-text-muted dark:text-text-muted-dark text-xs">·</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {session.caloriesBurned} kcal
                  </Text>
                  <Text className="text-text-muted dark:text-text-muted-dark text-xs">·</Text>
                  <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark">
                    {session.exercisesCount} {session.exercisesCount === 1 ? 'Exercise' : 'Exercises'}
                  </Text>
                </View>

                {/* Expandable Exercise Breakdown */}
                <View className="border-t border-input-border/60 dark:border-input-border-dark/60 pt-2.5 mt-1 flex-row justify-between items-center">
                  <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
                    {isExpanded ? 'Hide Details' : 'View Completed Exercises'}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.accent}
                  />
                </View>

                {isExpanded ? (
                  <View className="mt-3 pt-2 border-t border-input-border/40 dark:border-input-border-dark/40">
                    {session.exercises.map((ex, i) => (
                      <View
                        key={i}
                        className="flex-row items-center justify-between py-1.5 border-b border-input-border/20 last:border-b-0"
                      >
                        <View className="flex-row items-center gap-1.5">
                          <Ionicons name="checkmark-circle" size={15} color={colors.accent} />
                          <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                            {ex.name}
                          </Text>
                        </View>
                        <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                          {ex.setsSummary}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </TouchableOpacity>
            </SurfaceCard>
          );
        })
      )}
    </View>
  );
};

export default WorkoutHistoryTab;
