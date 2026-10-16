import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ExerciseVisualProps {
  name?: string;
  muscle?: string;
  category?: string;
  equipment?: string | string[];
  type?: string;
  difficulty?: string;
  secondaryMuscles?: string[] | string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  gifUrl?: string | null;
  tempo?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'banner';
  allowStockImage?: boolean;
  onOpenVideo?: () => void;
}

export function isGenericStockPhoto(url?: string | null): boolean {
  if (!url) return false;
  // Unsplash lifestyle stock photos that were duplicated across catalog
  return url.includes('images.unsplash.com');
}

export function getMuscleTheme(muscle?: string, category?: string, name?: string) {
  const m = (muscle || '').toLowerCase();
  const c = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();

  // Chest
  if (
    m.includes('chest') ||
    m.includes('pec') ||
    n.includes('bench') ||
    n.includes('push-up') ||
    n.includes('chest')
  ) {
    return {
      key: 'chest',
      label: 'CHEST',
      icon: 'barbell-outline' as const,
      color: '#10B981', // Emerald
      bgClass: 'bg-emerald-500/15 dark:bg-emerald-500/20',
      borderClass: 'border-emerald-500/30 dark:border-emerald-500/40',
      textClass: 'text-emerald-500 dark:text-emerald-400',
      accentBg: 'bg-emerald-500/25',
    };
  }

  // Back
  if (
    m.includes('back') ||
    m.includes('lat') ||
    m.includes('trap') ||
    n.includes('pull-up') ||
    n.includes('row') ||
    n.includes('deadlift') ||
    n.includes('pulldown')
  ) {
    return {
      key: 'back',
      label: 'BACK',
      icon: 'layers-outline' as const,
      color: '#06B6D4', // Cyan
      bgClass: 'bg-cyan-500/15 dark:bg-cyan-500/20',
      borderClass: 'border-cyan-500/30 dark:border-cyan-500/40',
      textClass: 'text-cyan-500 dark:text-cyan-400',
      accentBg: 'bg-cyan-500/25',
    };
  }

  // Legs & Glutes
  if (
    m.includes('leg') ||
    m.includes('quad') ||
    m.includes('hamstring') ||
    m.includes('calf') ||
    m.includes('glute') ||
    n.includes('squat') ||
    n.includes('lunge') ||
    n.includes('leg press')
  ) {
    return {
      key: 'legs',
      label: m.includes('glute') ? 'GLUTES' : 'LEGS',
      icon: 'walk-outline' as const,
      color: '#8B5CF6', // Violet
      bgClass: 'bg-violet-500/15 dark:bg-violet-500/20',
      borderClass: 'border-violet-500/30 dark:border-violet-500/40',
      textClass: 'text-violet-500 dark:text-violet-400',
      accentBg: 'bg-violet-500/25',
    };
  }

  // Shoulders
  if (
    m.includes('shoulder') ||
    m.includes('delt') ||
    n.includes('overhead') ||
    n.includes('military') ||
    n.includes('lateral raise') ||
    n.includes('shoulder press')
  ) {
    return {
      key: 'shoulders',
      label: 'DELTS',
      icon: 'triangle-outline' as const,
      color: '#F59E0B', // Amber
      bgClass: 'bg-amber-500/15 dark:bg-amber-500/20',
      borderClass: 'border-amber-500/30 dark:border-amber-500/40',
      textClass: 'text-amber-500 dark:text-amber-400',
      accentBg: 'bg-amber-500/25',
    };
  }

  // Arms (Biceps, Triceps, Forearms)
  if (
    m.includes('arm') ||
    m.includes('bicep') ||
    m.includes('tricep') ||
    m.includes('forearm') ||
    n.includes('curl') ||
    n.includes('extension') ||
    n.includes('dip')
  ) {
    return {
      key: 'arms',
      label: m.includes('tricep') ? 'TRICEPS' : m.includes('bicep') ? 'BICEPS' : 'ARMS',
      icon: 'flash-outline' as const,
      color: '#F43F5E', // Rose
      bgClass: 'bg-rose-500/15 dark:bg-rose-500/20',
      borderClass: 'border-rose-500/30 dark:border-rose-500/40',
      textClass: 'text-rose-500 dark:text-rose-400',
      accentBg: 'bg-rose-500/25',
    };
  }

  // Core / Abs
  if (
    m.includes('core') ||
    m.includes('ab') ||
    m.includes('oblique') ||
    n.includes('plank') ||
    n.includes('crunch')
  ) {
    return {
      key: 'core',
      label: 'CORE',
      icon: 'flame-outline' as const,
      color: '#F97316', // Orange
      bgClass: 'bg-orange-500/15 dark:bg-orange-500/20',
      borderClass: 'border-orange-500/30 dark:border-orange-500/40',
      textClass: 'text-orange-500 dark:text-orange-400',
      accentBg: 'bg-orange-500/25',
    };
  }

  // Cardio / Conditioning
  if (
    c.includes('cardio') ||
    m.includes('cardio') ||
    n.includes('run') ||
    n.includes('cycle') ||
    n.includes('rowing') ||
    n.includes('jump')
  ) {
    return {
      key: 'cardio',
      label: 'CARDIO',
      icon: 'speedometer-outline' as const,
      color: '#0EA5E9', // Sky
      bgClass: 'bg-sky-500/15 dark:bg-sky-500/20',
      borderClass: 'border-sky-500/30 dark:border-sky-500/40',
      textClass: 'text-sky-500 dark:text-sky-400',
      accentBg: 'bg-sky-500/25',
    };
  }

  // Full Body / General Strength Fallback
  return {
    key: 'full',
    label: 'FULL',
    icon: 'fitness-outline' as const,
    color: '#10B981',
    bgClass: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    borderClass: 'border-emerald-500/30 dark:border-emerald-500/40',
    textClass: 'text-emerald-500 dark:text-emerald-400',
    accentBg: 'bg-emerald-500/25',
  };
}

export function RepTempoBar({
  tempo,
  dark = false,
}: {
  tempo?: string | null;
  dark?: boolean;
}) {
  const tempoStr = tempo || '2-0-1-0';
  const lowerTempo = tempoStr.toLowerCase();

  // 1. Continuous cardio pacing
  if (lowerTempo.includes('continuous') || lowerTempo.includes('steady') || lowerTempo.includes('cardio')) {
    return (
      <View
        className={`p-3 rounded-xl border mt-2.5 ${
          dark
            ? 'bg-zinc-900 border-zinc-800'
            : 'bg-surface dark:bg-surface-dark border-input-border dark:border-input-border-dark'
        }`}
      >
        <View className="flex-row items-center justify-between mb-1.5">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="speedometer-outline" size={13} color="#0EA5E9" />
            <Text
              className={`text-[10px] font-black uppercase tracking-wider ${
                dark ? 'text-white' : 'text-text-primary dark:text-text-primary-dark'
              }`}
            >
              Cardio Pace & Execution Cadence
            </Text>
          </View>
          <View className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30">
            <Text className="text-[10px] font-extrabold text-sky-500 dark:text-sky-400">
              Continuous
            </Text>
          </View>
        </View>
        <Text
          className={`text-[11px] leading-4 font-medium ${
            dark ? 'text-zinc-300' : 'text-text-muted dark:text-text-muted-dark'
          }`}
        >
          Maintain smooth, continuous effort throughout each work interval without resting at lockout.
        </Text>
      </View>
    );
  }

  // 2. Isometric core holds / static tension
  if (lowerTempo.includes('hold') || lowerTempo.includes('isometric') || lowerTempo.includes('static')) {
    return (
      <View
        className={`p-3 rounded-xl border mt-2.5 ${
          dark
            ? 'bg-zinc-900 border-zinc-800'
            : 'bg-surface dark:bg-surface-dark border-input-border dark:border-input-border-dark'
        }`}
      >
        <View className="flex-row items-center justify-between mb-1.5">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="shield-checkmark-outline" size={13} color="#F97316" />
            <Text
              className={`text-[10px] font-black uppercase tracking-wider ${
                dark ? 'text-white' : 'text-text-primary dark:text-text-primary-dark'
              }`}
            >
              Isometric Time-Under-Tension
            </Text>
          </View>
          <View className="px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30">
            <Text className="text-[10px] font-extrabold text-orange-500 dark:text-orange-400">
              Static Hold
            </Text>
          </View>
        </View>
        <Text
          className={`text-[11px] leading-4 font-medium ${
            dark ? 'text-zinc-300' : 'text-text-muted dark:text-text-muted-dark'
          }`}
        >
          Brace your core, squeeze target muscles, and breathe steadily without breaking posture.
        </Text>
      </View>
    );
  }

  const parts = tempoStr.split('-');
  const phases = [
    { label: 'Down', sec: parts[0] || '2', icon: 'arrow-down-circle', color: '#38BDF8', note: 'Control Down' },
    { label: 'Pause', sec: parts[1] || '0', icon: 'pause-circle', color: '#FBBF24', note: 'Brief Hold' },
    { label: 'Up', sec: parts[2] || '1', icon: 'arrow-up-circle', color: '#34D399', note: 'Drive Up' },
    { label: 'Reset', sec: parts[3] || '0', icon: 'refresh-circle', color: '#A78BFA', note: 'Top Reset' },
  ];

  return (
    <View
      className={`p-3 rounded-xl border mt-2.5 ${
        dark
          ? 'bg-zinc-900 border-zinc-800'
          : 'bg-surface dark:bg-surface-dark border-input-border dark:border-input-border-dark'
      }`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="speedometer-outline" size={13} color="#10B981" />
          <Text
            className={`text-[10px] font-black uppercase tracking-wider ${
              dark ? 'text-white' : 'text-text-primary dark:text-text-primary-dark'
            }`}
          >
            Rep Cadence & Execution Rhythm
          </Text>
        </View>
        <View className="px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30">
          <Text className="text-[10px] font-extrabold text-accent dark:text-accent-dark">
            {tempoStr}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-1.5">
        {phases.map((p, i) => (
          <View
            key={i}
            className={`flex-1 p-1.5 rounded-lg border items-center ${
              dark
                ? 'bg-zinc-800/80 border-zinc-700/60'
                : 'bg-input dark:bg-input-dark border-input-border/50 dark:border-input-border-dark/50'
            }`}
          >
            <View className="flex-row items-center gap-1 mb-0.5">
              <Ionicons name={p.icon as any} size={11} color={p.color} />
              <Text
                className={`text-[11px] font-black ${
                  dark ? 'text-white' : 'text-text-primary dark:text-text-primary-dark'
                }`}
              >
                {p.sec}s
              </Text>
            </View>
            <Text
              className={`text-[8px] font-semibold uppercase tracking-tight ${
                dark ? 'text-zinc-400' : 'text-text-muted dark:text-text-muted-dark'
              }`}
              numberOfLines={1}
            >
              {p.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ExerciseVisual({
  name,
  muscle,
  category,
  equipment,
  type,
  difficulty,
  secondaryMuscles,
  imageUrl,
  thumbnailUrl,
  tempo,
  size = 'md',
  allowStockImage = false,
  onOpenVideo,
}: ExerciseVisualProps) {
  const theme = getMuscleTheme(muscle, category, name);
  const activeUrl = thumbnailUrl || imageUrl;
  const isStock = isGenericStockPhoto(activeUrl);

  // Banner view (Full-width anatomy & technique hero showcase for Exercise Details Modal)
  if (size === 'banner') {
    const secMuscles = Array.isArray(secondaryMuscles)
      ? secondaryMuscles.join(', ')
      : secondaryMuscles;

    const eqStr = Array.isArray(equipment) ? equipment.join(', ') : equipment || 'Bodyweight';

    return (
      <View className="w-full mb-4">
        {/* Pro Anatomy & Technique Hero Showcase (Hevy & Strong Style) */}
        <View className={`w-full rounded-2xl p-4 border ${theme.bgClass} ${theme.borderClass}`}>
          <View className="flex-row items-start justify-between gap-3 mb-3">
            {/* Muscle Group Emblem */}
            <View
              className={`w-12 h-12 rounded-2xl items-center justify-center border ${theme.borderClass} bg-surface dark:bg-surface-dark shadow-sm`}
            >
              <Ionicons name={theme.icon} size={24} color={theme.color} />
            </View>

            <View className="flex-1 pr-1">
              <View className="flex-row items-center gap-2 mb-1">
                <View className="px-2.5 py-0.5 rounded-full bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark">
                  <Text className={`text-[10px] font-extrabold uppercase tracking-wider ${theme.textClass}`}>
                    {theme.label}
                  </Text>
                </View>
                {type ? (
                  <View className="px-2.5 py-0.5 rounded-full bg-surface/80 dark:bg-surface-dark/80 border border-input-border/70 dark:border-input-border-dark/70">
                    <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark">
                      {type}
                    </Text>
                  </View>
                ) : null}
                {difficulty ? (
                  <View className="px-2 py-0.5 rounded-full bg-surface/60 dark:bg-surface-dark/60 border border-input-border/50 dark:border-input-border-dark/50">
                    <Text className="text-[9px] font-semibold text-text-muted dark:text-text-muted-dark">
                      {difficulty}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark">
                Target: {muscle || theme.label}
              </Text>
            </View>

            {/* Option 3: Direct YouTube Video Form Tutorial Button */}
            {onOpenVideo && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onOpenVideo}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="px-3 py-2 rounded-xl bg-red-600 flex-row items-center gap-1.5 shadow-sm active:opacity-85"
                accessibilityLabel="Watch Form Video on YouTube"
              >
                <Ionicons name="logo-youtube" size={13} color="#FFFFFF" />
                <Text className="text-[11px] font-black text-white uppercase tracking-wide">
                  Form Video
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Secondary Muscles & Equipment Meta Footer */}
          <View className="pt-2.5 border-t border-input-border/40 dark:border-input-border-dark/40 flex-row flex-wrap items-center justify-between gap-2">
            {secMuscles ? (
              <Text className="text-xs text-text-muted dark:text-text-muted-dark flex-1">
                <Text className="font-semibold text-text-primary dark:text-text-primary-dark">Assists: </Text>
                {secMuscles}
              </Text>
            ) : null}

            <View className="flex-row items-center gap-1.5 bg-surface/60 dark:bg-surface-dark/60 px-2.5 py-1 rounded-lg border border-input-border/50 dark:border-input-border-dark/50">
              <Ionicons name="hardware-chip-outline" size={12} color={theme.color} />
              <Text className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">
                {eqStr}
              </Text>
            </View>
          </View>
        </View>

        {/* Rep Tempo Cadence Metronome Bar */}
        <RepTempoBar tempo={tempo} />
      </View>
    );
  }

  // Compact / Card view (sm, md, lg) for exercise lists
  // Render verified image thumbnail if available, otherwise clean muscle emblem
  if (activeUrl && (!isStock || allowStockImage)) {
    const imgSizeClass =
      size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-14 h-14' : 'w-12 h-12';

    return (
      <View className="relative">
        <Image
          source={{ uri: activeUrl }}
          className={`${imgSizeClass} rounded-2xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark`}
          resizeMode="cover"
        />
      </View>
    );
  }

  const containerClass =
    size === 'sm'
      ? 'w-10 h-10 rounded-xl'
      : size === 'lg'
      ? 'w-14 h-14 rounded-2xl'
      : 'w-12 h-12 rounded-2xl';

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 19;
  const labelTextSize = size === 'sm' ? 'text-[7px]' : size === 'lg' ? 'text-[9px]' : 'text-[8px]';

  return (
    <View
      className={`${containerClass} items-center justify-center border ${theme.bgClass} ${theme.borderClass} relative`}
    >
      <Ionicons name={theme.icon} size={iconSize} color={theme.color} />
      <Text
        numberOfLines={1}
        className={`${labelTextSize} font-black tracking-tight mt-0.5 ${theme.textClass}`}
      >
        {theme.label}
      </Text>
    </View>
  );
}
