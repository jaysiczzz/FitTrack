import React from 'react';
import { View, Text, DimensionValue } from 'react-native';

type ProgressBarProps = {
  label: string;
  value: string | number;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ label, value }) => (
  <View className="mb-3.5">
    <Text className="text-[#9BB0CA] mb-2 text-xs">{label}</Text>
    <View className="h-2 bg-[#0C1C2F] rounded-lg overflow-hidden">
      <View
        className="h-2 bg-accent dark:bg-accent-dark"
        style={{ width: value as DimensionValue }}
      />
    </View>
  </View>
);

export default ProgressBar;