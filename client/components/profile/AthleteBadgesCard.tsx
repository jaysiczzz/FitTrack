import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import SurfaceCard from '../ui/SurfaceCard';

export interface AthleteBadge {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  unlocked: boolean;
  progressText: string;
}

interface AthleteBadgesCardProps {
  currentStreak?: number;
  totalWorkouts?: number;
  totalMealsLogged?: number;
  hasHitMacroTarget?: boolean;
}

export default function AthleteBadgesCard({
  currentStreak = 0,
  totalWorkouts = 0,
  totalMealsLogged = 0,
  hasHitMacroTarget = false,
}: AthleteBadgesCardProps) {
  const { colors } = useThemeColors();

  const isMacroUnlocked = hasHitMacroTarget || totalMealsLogged >= 5;

  const badges: AthleteBadge[] = [
    {
      id: 'b-first',
      title: 'First Step',
      description: 'Completed your first workout session',
      icon: 'trophy',
      color: '#F59E0B',
      unlocked: totalWorkouts >= 1,
      progressText: totalWorkouts >= 1 ? 'Unlocked' : '0/1 Session',
    },
    {
      id: 'b-streak-7',
      title: 'Streak Master',
      description: 'Maintained 7 consecutive active days',
      icon: 'flame',
      color: '#EF4444',
      unlocked: currentStreak >= 7,
      progressText: currentStreak >= 7 ? 'Unlocked' : `${currentStreak}/7 Days`,
    },
    {
      id: 'b-century',
      title: 'Century Club',
      description: 'Logged 25+ comprehensive workouts',
      icon: 'medal',
      color: '#8B5CF6',
      unlocked: totalWorkouts >= 25,
      progressText: totalWorkouts >= 25 ? 'Unlocked' : `${totalWorkouts}/25 Workouts`,
    },
    {
      id: 'b-nutrition',
      title: 'Macro Precision',
      description: 'Hit daily calorie & macro targets',
      icon: 'restaurant',
      color: '#10B981',
      unlocked: isMacroUnlocked,
      progressText: isMacroUnlocked
        ? 'Unlocked'
        : totalMealsLogged > 0
        ? `${totalMealsLogged}/5 Logs`
        : '0/5 Logs',
    },
    {
      id: 'b-iron',
      title: 'Iron Dedication',
      description: 'Logged 50+ total workout sessions',
      icon: 'barbell',
      color: '#0EA5E9',
      unlocked: totalWorkouts >= 50,
      progressText: totalWorkouts >= 50 ? 'Unlocked' : `${totalWorkouts}/50`,
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <SurfaceCard className="mb-3">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-lg bg-amber-500/15 items-center justify-center">
            <Ionicons name="ribbon-outline" size={16} color="#F59E0B" />
          </View>
          <View>
            <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
              Athlete Milestones & Badges
            </Text>
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
              Earn trophies as you stay consistent
            </Text>
          </View>
        </View>

        <View className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25">
          <Text className="text-[10px] font-extrabold text-accent dark:text-accent-dark">
            {unlockedCount}/{badges.length} Unlocked
          </Text>
        </View>
      </View>

      {/* Horizontal Badges Reel */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2.5 py-1">
        {badges.map((badge) => {
          const isUnlocked = badge.unlocked;
          return (
            <View
              key={badge.id}
              className={`w-32 p-3 rounded-2xl border mr-2 items-center justify-between ${
                isUnlocked
                  ? 'bg-surface dark:bg-surface-dark border-input-border dark:border-input-border-dark'
                  : 'bg-input/60 dark:bg-input-dark/60 border-input-border/40 dark:border-input-border-dark/40 opacity-70'
              }`}
            >
              <View
                className={`w-11 h-11 rounded-2xl items-center justify-center mb-2 ${
                  isUnlocked ? 'bg-amber-500/15' : 'bg-black/10 dark:bg-white/5'
                }`}
              >
                <Ionicons
                  name={badge.icon}
                  size={20}
                  color={isUnlocked ? badge.color : colors.textMuted}
                />
              </View>

              <Text
                className={`text-xs font-bold text-center mb-0.5 ${
                  isUnlocked
                    ? 'text-text-primary dark:text-text-primary-dark'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
                numberOfLines={1}
              >
                {badge.title}
              </Text>

              <Text
                className="text-[9px] text-text-muted dark:text-text-muted-dark text-center leading-3 mb-2"
                numberOfLines={2}
              >
                {badge.description}
              </Text>

              <View
                className={`px-2 py-0.5 rounded-md ${
                  isUnlocked ? 'bg-emerald-500/15' : 'bg-input dark:bg-input-dark'
                }`}
              >
                <Text
                  className={`text-[9px] font-black uppercase ${
                    isUnlocked ? 'text-emerald-500' : 'text-text-muted dark:text-text-muted-dark'
                  }`}
                >
                  {badge.progressText}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SurfaceCard>
  );
}
