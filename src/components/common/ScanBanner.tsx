import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { icons } from '@/src/constants/icons';

interface ScanBannerProps {
    title: string;
    bgColor: string;
    buttonBg: string;
    buttonTextColor?: string;
    onPress?: () => void;
}

const ScanBanner: React.FC<ScanBannerProps> = ({
    title,
    bgColor,
    buttonBg,
    buttonTextColor = '#FFFFFF',
    onPress
}) => {
    const router = useRouter();
    const ScanIcon = icons.scan_icon;

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.push('/scanner');
        }
    };

    return (
        <View
            style={{ backgroundColor: bgColor }}
            className="rounded-[28px] flex-row items-center px-6 py-8"
        >
            <View className="mr-5 items-center justify-center">
                <ScanIcon width={150} height={150} fill="#FFFFFF" />
            </View>
            <View className="flex-1">
                <Text className="text-white text-[20px] font-inter-semibold leading-7 mb-6">
                    {title}
                </Text>
                <TouchableOpacity
                    style={{ backgroundColor: buttonBg }}
                    className="py-4 px-7 rounded-[14px] self-start"
                    activeOpacity={0.8}
                    onPress={handlePress}
                >
                    <Text style={{ color: buttonTextColor }} className="font-inter-bold text-[16px]">
                        Start Scan
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ScanBanner;
