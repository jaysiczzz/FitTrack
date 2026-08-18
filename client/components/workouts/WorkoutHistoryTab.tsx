import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MOCK_HISTORY, CompletedSession } from './mockData';
import { getWorkoutHistory } from '@/api/workout';

const WorkoutHistoryTab: React.FC = () => {
  const [history, setHistory] = useState<CompletedSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        setLoading(true);
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
        }
      } catch (err) {
        console.log('Failed to fetch history from API');
        if (isMounted) setHistory([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, []);

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
          <ActivityIndicator size="small" color="#00E5A0" />
        </View>
      ) : history.length === 0 ? (
        <View className="rounded-2xl border border-input-border dark:border-input-border-dark p-6 items-center my-4 bg-surface/50">
          <Text className="text-3xl mb-2">📋</Text>
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
            No workout history yet
          </Text>
          <Text className="text-text-muted text-xs mt-1 text-center">
            Complete your first daily workout to start logging your progress history!
          </Text>
        </View>
      ) : (
        history.map((session) => {
          const isExpanded = expandedId === session.id;
          return (
            <TouchableOpacity
              key={session.id}
              activeOpacity={0.9}
              onPress={() => toggleExpand(session.id)}
              className="mb-3 rounded-2xl border border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark p-4 shadow-sm"
            >
              {/* Header: Date & Status */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Text className="text-xs font-bold text-accent dark:text-accent-dark mr-2">
                    📅 {session.date}
                  </Text>
                </View>
                <View className="bg-accent/15 dark:bg-accent-dark/20 border border-accent/30 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-accent dark:text-accent-dark uppercase">
                    Completed
                  </Text>
                </View>
              </View>

              {/* Session Title */}
              <Text className="text-lg font-extrabold text-text-primary dark:text-text-primary-dark mb-2.5">
                {session.title}
              </Text>

              {/* Metrics Chips */}
              <View className="flex-row items-center gap-x-3 mb-3 bg-input dark:bg-input-dark p-2.5 rounded-xl border border-input-border/50 dark:border-input-border-dark/50">
                <View className="flex-row items-center">
                  <Text className="text-xs mr-1">⏱️</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {session.duration}
                  </Text>
                </View>
                <View className="h-3 w-px bg-input-border dark:bg-input-border-dark" />
                <View className="flex-row items-center">
                  <Text className="text-xs mr-1">🔥</Text>
                  <Text className="text-xs font-bold text-[#3B9EFF]">
                    {session.caloriesBurned} kcal
                  </Text>
                </View>
                <View className="h-3 w-px bg-input-border dark:bg-input-border-dark" />
                <View className="flex-row items-center">
                  <Text className="text-xs mr-1">💪</Text>
                  <Text className="text-xs font-bold text-text-muted">
                    {session.exercisesCount} Exercises
                  </Text>
                </View>
              </View>

              {/* Expandable Exercise Breakdown */}
              <View className="border-t border-input-border/60 dark:border-input-border-dark/60 pt-2.5 mt-1 flex-row justify-between items-center">
                <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
                  {isExpanded ? 'Hide Details' : 'View Completed Exercises'}
                </Text>
                <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                  {isExpanded ? '▲' : '▼'}
                </Text>
              </View>

              {isExpanded ? (
                <View className="mt-3 pt-2 border-t border-input-border/40 dark:border-input-border-dark/40">
                  {session.exercises.map((ex, i) => (
                    <View
                      key={i}
                      className="flex-row items-center justify-between py-1.5 border-b border-input-border/20 last:border-b-0"
                    >
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                        ✓ {ex.name}
                      </Text>
                      <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                        {ex.setsSummary}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
};

export default WorkoutHistoryTab;
