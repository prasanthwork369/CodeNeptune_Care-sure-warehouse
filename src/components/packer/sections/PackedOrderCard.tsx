import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { icons } from '@/src/constants/icons';
import { colors } from '@/src/theme/colors';
import { PackedOrderCardProps } from '@/src/types/packer';

const PackedOrderCard: React.FC<PackedOrderCardProps> = ({ order, isLast }) => {
    const router = useRouter();
    const PersonIcon = icons.person;

    return (
        <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => router.push({ pathname: '/completed/[id]', params: { id: order.id } })}
            className="flex-row items-center px-5 py-6 bg-white my-2  rounded-md"
            style={!isLast ? { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' } : undefined}
        >
            <View className="w-[46px] h-[46px] rounded-full items-center justify-center bg-[#F0F0F0] mr-4">
                <PersonIcon width={22} height={22} fill={colors.text.secondary} />
            </View>
            <View className="flex-1">
                <Text style={{ color: colors.text.DEFAULT }} className="text-[18px] font-inter-bold">
                    {order.orderId || order.id}
                </Text>
                <Text style={{ color: colors.text.secondary }} className="text-[14px] font-inter mt-0.5">
                    {order.customerName}
                </Text>
            </View>
            <Text style={{ color: colors.text.secondary }} className="text-[14px] font-inter">
                {order.totalItems} Items
            </Text>
        </TouchableOpacity>
    );
};

export default React.memo(PackedOrderCard);
