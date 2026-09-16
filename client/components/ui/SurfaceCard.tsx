import React from 'react';
import { View, ViewProps, Platform, StyleProp, ViewStyle } from 'react-native';

export interface SurfaceCardProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export default function SurfaceCard({
  children,
  className = '',
  style,
  ...props
}: SurfaceCardProps) {
  return (
    <View
      className={`bg-surface dark:bg-surface-dark rounded-2xl p-4 border border-input-border dark:border-input-border-dark ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
