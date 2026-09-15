import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

export interface AppIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  variant?: 'primary' | 'muted' | 'accent' | 'danger' | 'info' | 'warning';
  style?: any;
}

export default function AppIcon({
  name,
  size = 20,
  color,
  variant = 'primary',
  style,
}: AppIconProps) {
  const { colors } = useThemeColors();

  let resolvedColor = color;
  if (!resolvedColor) {
    switch (variant) {
      case 'accent':
        resolvedColor = colors.accent;
        break;
      case 'muted':
        resolvedColor = colors.textMuted;
        break;
      case 'danger':
        resolvedColor = colors.danger;
        break;
      case 'info':
        resolvedColor = colors.info;
        break;
      case 'warning':
        resolvedColor = colors.warning;
        break;
      case 'primary':
      default:
        resolvedColor = colors.textPrimary;
        break;
    }
  }

  return <Ionicons name={name} size={size} color={resolvedColor} style={style} />;
}
