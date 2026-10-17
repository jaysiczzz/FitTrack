import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle, StyleProp, Platform } from 'react-native';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export default function Skeleton({
  width,
  height,
  borderRadius = 12,
  className = '',
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const isNative = Platform.OS !== 'web';
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: isNative,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: isNative,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-input dark:bg-input-dark ${className}`}
      style={[
        {
          opacity,
          width: width as any,
          height: height as any,
          borderRadius,
        },
        style,
      ]}
    />
  );
}

/** Pre-composed Skeleton for standard Surface Cards */
export function CardSkeleton({ className = '', lines = 2 }: { className?: string; lines?: number }) {
  return (
    <View
      className={`p-4 rounded-2xl bg-surface dark:bg-surface-dark border-0 shadow-md shadow-slate-200/70 dark:shadow-none mb-3 ${className}`}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Skeleton width="40%" height={16} borderRadius={8} />
        <Skeleton width={32} height={32} borderRadius={16} />
      </View>
      <Skeleton width="75%" height={24} borderRadius={8} className="mb-2" />
      <Skeleton width="50%" height={12} borderRadius={6} />
      {lines > 2 && (
        <Skeleton width="60%" height={12} borderRadius={6} className="mt-2" />
      )}
    </View>
  );
}

/** Pre-composed Skeleton for List Items (e.g. food or exercise rows) */
export function ListItemSkeleton({ className = '' }: { className?: string }) {
  return (
    <View
      className={`flex-row items-center p-3 rounded-xl bg-input/40 dark:bg-input-dark/40 border border-input-border/40 dark:border-input-border-dark/40 mb-2 ${className}`}
    >
      <Skeleton width={40} height={40} borderRadius={20} className="mr-3" />
      <View className="flex-1">
        <Skeleton width="60%" height={14} borderRadius={6} className="mb-1.5" />
        <Skeleton width="35%" height={10} borderRadius={4} />
      </View>
      <Skeleton width={28} height={28} borderRadius={14} />
    </View>
  );
}

/** Pre-composed Skeleton for 2x2 Stat Blocks */
export function StatCardSkeleton() {
  return (
    <View className="flex-1 min-h-[96px] p-3.5 rounded-2xl bg-surface dark:bg-surface-dark border-0 shadow-md shadow-slate-200/70 dark:shadow-none justify-between">
      <View className="flex-row items-center justify-between mb-1.5">
        <Skeleton width="40%" height={10} borderRadius={4} />
        <Skeleton width={28} height={28} borderRadius={10} />
      </View>
      <Skeleton width="60%" height={20} borderRadius={6} className="mb-1" />
      <Skeleton width="70%" height={10} borderRadius={4} />
    </View>
  );
}
