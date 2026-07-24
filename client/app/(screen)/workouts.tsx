import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
} from 'react-native';

type SetRow = {
  id: string;
  weight?: string;
  reps?: string;
  bodyweight?: boolean;
  done?: boolean;
};

const ExerciseCard: React.FC<{
  name: string;
  category?: string;
  type?: string;
  sets: SetRow[];
  onToggle: (setId: string) => void;
}> = ({
  name,
  category,
  type = 'Strength',
  sets,
  onToggle,
}) => {
  return (
    <View className="mb-3 rounded-2xl border border-[#0F2B3A] bg-surface p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-extrabold text-text-primary">
            {name}
          </Text>
          {category && (
            <Text className="text-xs text-text-muted">
              {category}
            </Text>
          )}
        </View>
        <View className="rounded-lg border border-[#202830] px-2 py-1">
          <Text className="text-xs text-[#9BB0CA]">
            {type}
          </Text>
        </View>
      </View>
      <View>
        <View className="mb-2 flex-row justify-between">
          <Text className="w-1/4 text-center text-[11px] text-text-muted">
            Set
          </Text>
          <Text className="w-1/4 text-center text-[11px] text-text-muted">
            Weight (kg)
          </Text>
          <Text className="w-1/4 text-center text-[11px] text-text-muted">
            Reps
          </Text>
          <Text className="w-1/4 text-center text-[11px] text-text-muted" />
        </View>
        {sets.map((s) => (
          <View
            key={s.id}
            className="mb-2 flex-row items-center"
          >
            <View className="mr-1 flex-1 items-center rounded-lg border border-[#152330] bg-input py-2">
              <Text className="text-text-primary">
                {s.id}
              </Text>
            </View>
            <View className="mr-1 flex-1 items-center rounded-lg border border-[#152330] bg-input py-2">
              <Text className="text-text-primary">
                {s.bodyweight ? 'BW' : s.weight ?? ''}
              </Text>
            </View>
            <View className="mr-1 flex-1 items-center rounded-lg border border-[#152330] bg-input py-2">
              <Text className="text-text-primary">
                {s.reps ?? ''}
              </Text>
            </View>
            <Pressable
              onPress={() => onToggle(s.id)}
              className={`h-9 w-9 items-center justify-center rounded-full ${
                s.done
                  ? 'bg-accent'
                  : 'border border-[#1F2A35] bg-input'
              }`}
            >
              <Text
                className={
                  s.done
                    ? 'font-extrabold text-[#071018]'
                    : 'text-[#9BB0CA]'
                }
              >
                {s.done ? '✓' : '○'}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function Workouts() {
  const [benchSets, setBenchSets] = React.useState<SetRow[]>([
    { id: '1', weight: '60', reps: '10', done: true },
    { id: '2', weight: '65', reps: '8', done: true },
    { id: '3', weight: '', reps: '', done: false },
  ]);
  const [pullSets, setPullSets] = React.useState<SetRow[]>([
    { id: '1', bodyweight: true, reps: '12', done: true },
    { id: '2', bodyweight: true, reps: '', done: false },
  ]);
  const toggleSet = (
    exercise: 'bench' | 'pull',
    id: string
  ) => {
    const updater = (sets: SetRow[]) =>
      sets.map((set) =>
        set.id === id
          ? { ...set, done: !set.done }
          : set
      );
    if (exercise === 'bench') {
      setBenchSets(updater);
    }
    if (exercise === 'pull') {
      setPullSets(updater);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-20">
        <Text className="mb-3 text-sm text-text-muted">
          Track your exercise completion and performance
        </Text>
        <View className="mt-1">
          <Pressable
            className="mb-3 self-end rounded-lg border border-[#14333E] bg-input px-3 py-2"
          >
            <Text className="text-accent font-bold">
              + Add Workout
            </Text>
          </Pressable>
          <ExerciseCard
            name="Bench Press"
            category="Chest · Primary"
            type="Strength"
            sets={benchSets}
            onToggle={(id) =>
              toggleSet('bench', id)
            }
          />
          <ExerciseCard
            name="Pull-ups"
            category="Back · Primary"
            type="Strength"
            sets={pullSets}
            onToggle={(id) =>
              toggleSet('pull', id)
            }
          />
          <Pressable
            onPress={() =>
              console.log('Complete Workout Session')
            }
            className="mt-2 items-center rounded-xl bg-accent py-4"
          >
            <Text className="text-base font-extrabold text-[#071018]">
              Complete Workout Session
            </Text>
          </Pressable>
          {/* AI PLAN */}
          <View className="mt-3 rounded-xl border border-[#15323B] bg-surface p-3">
            <View className="mb-2 flex-row items-center">
              <Text className="mr-2 text-xl">
                🤖
              </Text>
              <View className="flex-1">
                <Text className="font-bold text-text-primary">
                  Today's AI-Generated Plan
                </Text>
                <View className="mt-1 self-start rounded-full bg-accent px-2 py-1">
                  <Text className="text-xs font-bold text-[#071018]">
                    Personalized
                  </Text>
                </View>
              </View>
            </View>
            <Text className="leading-5 text-[#CFE8FF]">
              <Text className="font-bold text-accent">
                Based on your muscle gain goal
              </Text>
              {' '}and yesterday's cardio, today is optimized for Upper Body Strength.
              Estimated calorie burn:
              <Text className="font-bold text-accent">
                {' '}380–420 kcal
              </Text>
              .
            </Text>
          </View>
          {/* SESSION STATS */}
          <View className="mt-4">
            <Text className="mb-2 text-base font-bold text-text-primary">
              Session Stats
            </Text>
            <View>
              <View className="mb-3 rounded-xl border border-[#0F2B3A] bg-surface p-3">
                <Text className="mb-1 text-xs text-text-muted">
                  DURATION
                </Text>
                <Text className="text-[22px] font-black text-[#00E5A0]">
                  34
                  <Text className="text-sm text-text-muted">
                    {' '}min
                  </Text>
                </Text>
              </View>
              <View className="rounded-xl border border-[#0F2B3A] bg-surface p-3">
                <Text className="mb-1 text-xs text-text-muted">
                  ESTIMATED BURN
                </Text>
                <Text className="text-[22px] font-black text-[#3B9EFF]">
                  210
                  <Text className="text-sm text-text-muted">
                    {' '}kcal
                  </Text>
                </Text>
              </View>
            </View>
          </View>
          {/* PERSONAL RECORDS */}
          <View className="mt-4">
            <Text className="mb-2 text-base font-bold text-text-primary">
              Personal Records
            </Text>
            <View className="rounded-xl border border-[#0F2B3A] bg-surface p-3">
              {[
                ['🏆', '#FFD166', 'Bench Press', 'PR: 80kg × 6 reps'],
                ['🏆', '#9AD3FF', 'Pull-ups', 'PR: 15 reps'],
                ['🏆', '#E6B89C', 'Squat', 'PR: 100kg × 5 reps'],
              ].map(([icon, color, name, record], index) => (
                <React.Fragment key={name}>
                  <View className="flex-row items-center py-2">
                    <View
                      style={{
                        backgroundColor: color,
                      }}
                      className="mr-3 h-10 w-10 items-center justify-center rounded-lg"
                    >
                      <Text>
                        {icon}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-text-primary">
                        {name}
                      </Text>
                      <Text className="text-xs text-text-muted">
                        {record}
                      </Text>
                    </View>
                  </View>
                  {index !== 2 && (
                    <View className="h-px bg-[#0F2B3A]" />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}