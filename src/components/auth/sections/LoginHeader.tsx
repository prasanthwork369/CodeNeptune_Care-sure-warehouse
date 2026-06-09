import React from 'react';
import { View, Text } from 'react-native';
import Logo from '@/assets/images/logo.svg';

export const LoginHeader: React.FC = () => {
  return (
    <View>
      {/* Logo Box */}
      <View className="mb-10">
        <View
          style={{ backgroundColor: '#EAF9CC' }}
          className="w-20 h-20 rounded-[22px] items-center justify-center"
        >
          <Logo width={100} height={100} />
        </View>
      </View>

      {/* Heading Section */}
      <View className="mb-10">
        <Text className="text-[28px] tracking-tight">
          <Text className="font-inter-extrabold text-[#0F7635]">Log in</Text>
          <Text className="font-inter-medium text-[#222222]"> to</Text>
        </Text>
        <Text className="text-[26px] font-inter-medium text-[#222222] tracking-tight ">
          access your account
        </Text>
      </View>
    </View>
  );
};
