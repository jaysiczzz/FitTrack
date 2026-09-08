import React from 'react';
import { View, Text, DimensionValue } from 'react-native';

export interface ProgressBarProps {
  /** Explicit percentage (0-100), or auto-computed if current & target are provided */
  percentage?: number;
  /** Current value for auto-calculating percentage */
  current?: number;
  /** Target value for auto-calculating percentage */
  target?: number;
  /** Unit for current/target (e.g. "g", "ml", default: "") */
  unit?: string;
  /** Primary label on the left (e.g. "Protein") */
  label?: string;
  /** Custom right-hand value text (overrides default auto-formatted text) */
  valueText?: string;
  /** Bar fill color (hex string, default: '#00E5A0') */
  color?: string;
  /** Bar height in pixels (default: 6) */
  height?: number;
  /** Optional custom container className */
  className?: string;
  /** Optional custom track background className */
  trackClassName?: string;
}

export default function ProgressBar({
  percentage: explicitPercentage,
  current,
  target,
  unit = '',
  label,
  valueText,
  color,
  height = 8,
  className = 'mb-2',
  trackClassName,
}: ProgressBarProps) {
  // Calculate percentage if not explicitly provided
  const computedPercentage =
    explicitPercentage !== undefined
      ? explicitPercentage
      : target && target > 0 && current !== undefined
      ? Math.round((current / target) * 100)
      : 0;

  const clampedPercentage = Math.min(100, Math.max(0, computedPercentage));
  const fillWidth = `${clampedPercentage}%` as DimensionValue;

  // Render right-side value text
  const renderValueText = () => {
    if (valueText !== undefined) {
      return (
        <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs">
          {valueText}
        </Text>
      );
    }

    if (current !== undefined && target !== undefined) {
      return (
        <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs">
          {current}{unit}{' '}
          <Text className="text-text-muted dark:text-text-muted-dark font-normal">
            / {target}{unit}
          </Text>{' '}
          ({clampedPercentage}%)
        </Text>
      );
    }

    return null;
  };

  const hasHeader = Boolean(label || valueText || (current !== undefined && target !== undefined));

  return (
    <View className={className}>
      {hasHeader ? (
        <View className="flex-row justify-between items-center mb-1">
          {label ? (
            <Text className="text-text-muted dark:text-text-muted-dark text-xs font-semibold">
              {label}
            </Text>
          ) : (
            <View />
          )}
          {renderValueText()}
        </View>
      ) : null}

      <View
        className={`w-full ${trackClassName ?? 'bg-input dark:bg-input-dark'} rounded-full overflow-hidden justify-center`}
        style={{ height }}
      >
        <View
          className={`h-full rounded-full ${color ? '' : 'bg-accent dark:bg-accent-dark'}`}
          style={{
            width: fillWidth,
            ...(color ? { backgroundColor: color } : {}),
          }}
        />
      </View>
    </View>
  );
}