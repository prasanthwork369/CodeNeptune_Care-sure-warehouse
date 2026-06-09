import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface LoginActionProps {
  isLoading: boolean;
  onLogin: () => void;
}

export const LoginAction: React.FC<LoginActionProps> = ({ isLoading, onLogin }) => {
  return (
    <View className="mt-auto pb-10">
      <TouchableOpacity
        onPress={onLogin}
        disabled={isLoading}
        style={{ backgroundColor: '#117B3E' }}
        className={`py-4 rounded-full items-center shadow-md active:opacity-90 ${isLoading ? 'opacity-80' : ''}`}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg">Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
