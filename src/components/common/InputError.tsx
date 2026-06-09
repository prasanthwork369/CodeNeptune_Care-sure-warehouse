import React from 'react';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';
import { Text } from 'react-native';

interface InputErrorProps {
  message?: string;
  visible?: boolean;
}

const InputError = ({ message, visible }: InputErrorProps) => {
  if (!visible || !message) return null;

  return (
    <Animated.View 
      entering={FadeInUp.duration(300)} 
      exiting={FadeOut.duration(200)}
      className="mt-1.5 ml-1"
    >
      <Text className="text-[#FF4D4D] text-[13px] font-inter-medium">
        {message}
      </Text>
    </Animated.View>
  );
};

export default InputError;
