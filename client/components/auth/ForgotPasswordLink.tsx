import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  onPress?: () => void;
}

const ForgotPasswordLink: React.FC<Props> = ({ onPress }) => {
  return (
    <View className="flex-row justify-center items-center mt-2.5">
      <Text className="text-text-muted dark:text-text-muted-dark text-[13px]">Forgot password? </Text>
      <TouchableOpacity onPress={onPress}>
        <Text className="text-accent dark:text-accent-dark text-[13px] ml-1 font-semibold">Reset</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ForgotPasswordLink;