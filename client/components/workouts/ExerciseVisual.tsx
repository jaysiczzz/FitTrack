import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
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
    { label: 'Down', sec: parts[0] || '2', icon: 'arrow-down-circle', color: '#38BDF8', note: 'Eccentric' },
    { label: 'Pause', sec: parts[1] || '0', icon: 'pause-circle', color: '#FBBF24', note: 'Stretch' },
    { label: 'Up', sec: parts[2] || '1', icon: 'arrow-up-circle', color: '#34D399', note: 'Concentric' },
    { label: 'Reset', sec: parts[3] || '0', icon: 'refresh-circle', color: '#A78BFA', note: 'Lockout' },
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
  secondaryMuscles,
  imageUrl,
  thumbnailUrl,
  gifUrl,
  tempo,
  size = 'md',
  allowStockImage = false,
  onOpenVideo,
}: ExerciseVisualProps) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const theme = getMuscleTheme(muscle, category, name);
  const activeUrl = thumbnailUrl || imageUrl;
  const isStock = isGenericStockPhoto(activeUrl);

  // Preferred motion URL is gifUrl, followed by non-stock image
  const motionUrl = gifUrl || (!isStock || allowStockImage ? activeUrl : null);

  React.useEffect(() => {
    setHasLoaded(false);
    setHasError(false);
  }, [motionUrl]);

  // Banner view (Full-width motion showcase for Exercise Details Modal)
  if (size === 'banner') {
    const secMuscles = Array.isArray(secondaryMuscles)
      ? secondaryMuscles.join(', ')
      : secondaryMuscles;

    const eqStr = Array.isArray(equipment) ? equipment.join(', ') : equipment || 'No Equipment';

    // If an animated motion demo or verified image exists and hasn't errored
    if (motionUrl && !hasError) {
      return (
        <View className="w-full mb-4">
          {/* Animated Demonstration Player Container */}
          <View className="w-full h-64 rounded-2xl bg-zinc-950 dark:bg-black border border-input-border dark:border-input-border-dark overflow-hidden relative justify-center items-center">
            {/* Background Loading Placeholder (Visible only before first frame renders, never overlays the GIF) */}
            {!hasLoaded && (
              <View
                style={{ zIndex: 0 }}
                className="absolute inset-0 items-center justify-center pointer-events-none"
              >
                <ActivityIndicator size="small" color="#10B981" />
                <Text className="text-[10px] font-bold text-white/50 mt-2">Loading motion demonstration...</Text>
              </View>
            )}

            {/* Clickable Image Viewport (Tapping anywhere opens fullscreen view) */}
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => setIsFullscreen(true)}
              style={{ zIndex: 1 }}
              className="w-full h-full justify-center items-center"
            >
              <Image
                source={{ uri: motionUrl }}
                className="w-full h-full"
                resizeMode="contain"
                onLoad={() => setHasLoaded(true)}
                onError={() => {
                  setHasError(true);
                }}
              />
            </TouchableOpacity>

            {/* Top Controls Overlay (Elevated with zIndex 20 so it is never covered by the image) */}
            <View
              pointerEvents="box-none"
              style={{ zIndex: 20 }}
              className="absolute top-2.5 left-2.5 right-2.5 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-1.5" pointerEvents="box-none">
                <View className="px-2.5 py-1 rounded-full bg-black/85 border border-white/20 flex-row items-center gap-1.5 shadow-sm">
                  <View className="w-2 h-2 rounded-full bg-emerald-400" />
                  <Text className="text-[10px] font-black tracking-wider text-white uppercase">
                    MOTION DEMO
                  </Text>
                </View>
                {muscle ? (
                  <View className="px-2 py-1 rounded-full bg-black/75 border border-white/15">
                    <Text className="text-[9px] font-extrabold text-white/90 uppercase">
                      {muscle}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View className="flex-row items-center gap-2" pointerEvents="box-none">
                {onOpenVideo && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onOpenVideo}
                    style={{ zIndex: 30 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="px-2.5 py-1 rounded-full bg-red-600 border border-red-400/40 flex-row items-center gap-1 shadow-sm"
                  >
                    <Ionicons name="play" size={10} color="#FFFFFF" />
                    <Text className="text-[10px] font-black tracking-wide text-white uppercase">
                      Video
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsFullscreen(true)}
                  style={{ zIndex: 30 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="w-7 h-7 rounded-full bg-black/85 border border-white/25 items-center justify-center shadow-sm"
                  accessibilityLabel="Open Fullscreen"
                >
                  <Ionicons name="expand-outline" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Rep Tempo Cadence Metronome Bar (Positioned cleanly below the demo player with no visual overlap) */}
          <RepTempoBar tempo={tempo} />

          {/* Fullscreen Motion Demo Modal */}
          <Modal
            visible={isFullscreen}
            transparent
            animationType="fade"
            onRequestClose={() => setIsFullscreen(false)}
          >
            <View className="flex-1 bg-black/95 justify-between p-4">
              {/* Header */}
              <View className="flex-row items-center justify-between pt-8 pb-3 px-2" style={{ zIndex: 50 }}>
                <View className="flex-1 pr-3">
                  <Text className="text-white text-base font-black" numberOfLines={1}>
                    {name || 'Exercise Motion Demo'}
                  </Text>
                  <Text className="text-white/60 text-xs mt-0.5">
                    Target: {muscle || theme.label} • Rhythm: {tempo || '2-0-1-0'}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsFullscreen(false)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={{ zIndex: 60 }}
                  className="w-10 h-10 rounded-full bg-white/15 items-center justify-center border border-white/20"
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Large Centered Visual */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setIsFullscreen(false)}
                className="flex-1 justify-center items-center py-4"
              >
                <Image
                  source={{ uri: motionUrl }}
                  className="w-full h-full max-h-[80%]"
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* Footer with Dark Tempo & Video deep-link */}
              <View className="pb-6" style={{ zIndex: 50 }}>
                <RepTempoBar tempo={tempo} dark />
                {onOpenVideo && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setIsFullscreen(false);
                      onOpenVideo();
                    }}
                    className="mt-3 bg-red-600 p-3 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
                  >
                    <Ionicons name="logo-youtube" size={16} color="#FFFFFF" />
                    <Text className="text-white text-xs font-black">Open Form Breakdown Video</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>
        </View>
      );
    }

    // Fallback Banner view (when media is unavailable or offline)
    return (
      <View className="w-full mb-4">
        <View className={`w-full rounded-2xl p-4 border ${theme.bgClass} ${theme.borderClass}`}>
          <View className="flex-row items-center gap-3 mb-3">
            <View
              className={`w-12 h-12 rounded-2xl items-center justify-center border ${theme.borderClass} bg-surface dark:bg-surface-dark`}
            >
              <Ionicons name={theme.icon} size={24} color={theme.color} />
            </View>

            <View className="flex-1">
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
              </View>

              <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                Primary Target: {muscle || theme.label}
              </Text>
            </View>

            {onOpenVideo && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onOpenVideo}
                className="px-2.5 py-1.5 rounded-xl bg-red-600 flex-row items-center gap-1 shadow-sm"
              >
                <Ionicons name="play" size={11} color="#FFFFFF" />
                <Text className="text-[10px] font-black text-white uppercase">Video</Text>
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

            <View className="flex-row items-center gap-1.5">
              <Ionicons name="hardware-chip-outline" size={13} color={theme.color} />
              <Text className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">
                {eqStr}
              </Text>
            </View>
          </View>
        </View>

        {/* Rep Tempo Bar */}
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
        {gifUrl ? (
          <View className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
        ) : null}
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
      {gifUrl ? (
        <View className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
      ) : null}
    </View>
  );
}
