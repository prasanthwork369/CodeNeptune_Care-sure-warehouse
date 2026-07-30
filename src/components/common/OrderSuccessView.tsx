import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { icons } from '@/src/constants/icons';
import { colors } from '@/src/theme/colors';
import ScreenWrapper from './ScreenWrapper';

interface OrderSuccessViewProps {
    title: string;
    subtitle?: string;
    backLabel: string;
    backRoute?: string;
    dateLabel?: string;
}

const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({ title, subtitle, backLabel, backRoute, dateLabel = 'Packed on' }) => {
    const router = useRouter();
    const { orderId, totalItems } = useLocalSearchParams();
    const now = new Date();
    const dispatchedOn = now.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const Checkmark = icons.checkmarkPure;
    const Scan = icons.scan;

    return (
        <ScreenWrapper style={{ backgroundColor: '#F7F7F7' }}>
        <View className="flex-1 px-6 justify-center">
            {/* Success Icon */}
            <View className="items-center mb-6">
                <View className="w-32 h-32 rounded-full bg-[#D8EFE6] items-center justify-center">
                    <View className="w-20 h-20 rounded-full bg-[#2EC07A] items-center justify-center">
                        <Checkmark width={40} height={40} fill="white" />
                    </View>
                </View>
            </View>

            {/* Title */}
            <Text style={{ color: colors.text.DEFAULT }} className="text-[24px] font-inter-bold text-center mb-2">
                {title}
            </Text>
            {subtitle ? (
                <Text style={{ color: colors.text.secondary }} className="text-[16px] font-inter text-center mb-10">
                    {subtitle}
                </Text>
            ) : (
                <View className="mb-10" />
            )}

            {/* Info Card */}
            <View className="bg-white rounded-[16px] px-5 py-2 mb-8" style={{ borderWidth: 1, borderColor: '#EFEFEF' }}>
                <View className="flex-row items-center py-4 border-b border-[#F0F0F0]">
                    <Text style={{ color: colors.text.secondary, width: 130 }} className="text-[15px] font-inter">Order ID</Text>
                    <Text style={{ color: colors.text.DEFAULT }} className="text-[15px] font-inter-semibold flex-1">#{orderId}</Text>
                </View>
                <View className="flex-row items-center py-4 border-b border-[#F0F0F0]">
                    <Text style={{ color: colors.text.secondary, width: 130 }} className="text-[15px] font-inter">Total Items</Text>
                    <Text style={{ color: colors.text.DEFAULT }} className="text-[15px] font-inter-semibold flex-1">{totalItems}</Text>
                </View>
                <View className="flex-row items-center py-4">
                    <Text style={{ color: colors.text.secondary, width: 130 }} className="text-[15px] font-inter">{dateLabel}</Text>
                    <Text style={{ color: colors.text.DEFAULT }} className="text-[15px] font-inter-semibold flex-1">{dispatchedOn}</Text>
                </View>
            </View>

            {/* Buttons */}
            <View className="w-full flex-row mt-4">
                <TouchableOpacity
                    className="flex-1 h-[58px] rounded-[20px] items-center justify-center mr-2"
                    style={{ backgroundColor: '#DCDEDC' }}
                    onPress={() => {
                        const target = backRoute || '/(tabs)/checker';
                        router.replace(target as any);
                    }}
                >
                    <Text className="text-[15px] font-inter-semibold text-[#222222]">{backLabel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-1 h-[58px] rounded-[20px] flex-row items-center justify-center ml-2"
                    style={{ backgroundColor: colors.brand.primary }}
                    onPress={() => router.replace('/scanner' as any)}
                >
                    <Scan width={18} height={18} fill="white" />
                    <Text className="text-white text-[15px] font-inter-semibold ml-2">Scan Next Order</Text>
                </TouchableOpacity>
            </View>
        </View>
        </ScreenWrapper>
    );
};

export default OrderSuccessView;
