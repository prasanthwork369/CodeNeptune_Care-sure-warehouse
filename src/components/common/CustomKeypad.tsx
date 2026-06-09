import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomKeypadProps {
    onPress: (digit: string) => void;
    onDelete: () => void;
    style?: ViewStyle;
}

const CustomKeypad = ({ onPress, onDelete, style }: CustomKeypadProps) => {
    const insets = useSafeAreaInsets();
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

    return (
        <View
            className="w-full bg-[#D1D3D9]"
            style={[{ paddingBottom: (insets.bottom || 20), paddingTop: 10 }, style]}
        >
            <View className="flex-row flex-wrap justify-between px-2">
                {digits.map((digit) => (
                    <TouchableOpacity
                        key={digit}
                        onPress={() => onPress(digit)}
                        activeOpacity={0.5}
                        className="w-[32%] h-[54px] items-center justify-center mb-2 rounded-lg bg-[#FFFFFF]"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 1,
                            elevation: 1,
                        }}
                    >
                        <Text className="text-[26px] font-normal text-[#1A1A1A]">{digit}</Text>
                    </TouchableOpacity>
                ))}

                {/* Bottom Row */}
                <View className="w-[32%] h-[54px] items-center justify-center mb-2" />

                <TouchableOpacity
                    onPress={() => onPress('0')}
                    activeOpacity={0.5}
                    className="w-[32%] h-[54px] items-center justify-center mb-2 rounded-lg bg-[#FFFFFF]"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 1,
                        elevation: 1,
                    }}
                >
                    <Text className="text-[26px] font-normal text-[#1A1A1A]">0</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onDelete}
                    activeOpacity={0.5}
                    className="w-[32%] h-[54px] items-center justify-center mb-2 rounded-lg"
                >
                    <Ionicons name="backspace" size={28} color="#1A1A1A" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default CustomKeypad;
