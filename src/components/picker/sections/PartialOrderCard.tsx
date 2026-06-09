import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Order } from '@/src/types/order.types';
import { icons } from '@/src/constants/icons';
import { colors } from '@/src/theme/colors';
import { formatOrderDate } from '@/src/utils/dateUtils';

interface PartialOrderCardProps {
    order: Order;
}

const MAX_CHIPS = 3;

const PartialOrderCard: React.FC<PartialOrderCardProps> = ({ order }) => {
    const router = useRouter();
    const [claiming] = useState(false);

    const isAvailable = order.stockStatus === 'available';
    const HourglassTop = icons.hourglassTop;

    // background colours matching the design
    const cardBg     = isAvailable ? '#C8DEC8' : '#E0D6AF';
    const chipBg     = isAvailable ? '#B0CEB0' : '#F5F5DA';

    const meds       = order.outOfStockMeds ?? [];
    const visibleMeds = meds.slice(0, MAX_CHIPS);
    const extraCount  = meds.length - MAX_CHIPS;

    const handlePress = () => {
        if (claiming) return;
        // Navigate immediately — claim is handled on mount in OrderPickingView
        router.push({ pathname: '/order/[id]', params: { id: order.id } });
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePress}
            disabled={claiming}
            className="p-5 rounded-[20px] mb-4"
            style={{ backgroundColor: cardBg, opacity: claiming ? 0.6 : 1 }}
        >
            {/* Header */}
            <Text style={{ color: colors.text.DEFAULT }} className="font-inter-bold text-[18px] mb-0.5">
                Order #{order.orderId || order.id}
            </Text>
            <Text style={{ color: colors.text.DEFAULT }} className="text-[13px] font-inter mb-4">
                {order.orderDate || formatOrderDate(order.date || '')}
            </Text>

            {/* Out of stock label */}
            <Text style={{ color: colors.text.DEFAULT }} className="text-[14px] font-inter-medium mb-2">
                Out of stock items
            </Text>

            {/* Medicine chips */}
            <View className="flex-row flex-wrap mb-5">
                {visibleMeds.map((med, index) => (
                    <View
                        key={index}
                        style={{ backgroundColor: chipBg, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8, marginBottom: 8 }}
                    >
                        <Text style={{ color: colors.text.DEFAULT, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
                            {med}
                        </Text>
                    </View>
                ))}
                {extraCount > 0 && (
                    <View
                        style={{ backgroundColor: chipBg, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8, marginBottom: 8 }}
                    >
                        <Text style={{ color: colors.text.DEFAULT, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
                            +{extraCount}
                        </Text>
                    </View>
                )}
            </View>

            {/* Footer */}
            <View className="flex-row justify-between items-center">
                <Text style={{ color: colors.text.DEFAULT }} className="text-[13px] font-inter">
                    {order.pickedCount ?? 0} of {order.totalCount ?? 0} Items Picked
                </Text>

                {isAvailable ? (
                    <View
                        style={{ backgroundColor: colors.brand.primary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}
                    >
                        <Text className="text-white font-inter-semibold text-[13px] mr-1">
                            Stock Available
                        </Text>
                        <Text className="text-white font-inter-bold text-[13px]">{'>>'}</Text>
                    </View>
                ) : (
                    <View className="flex-row items-center">
                        <Text style={{ color: colors.text.DEFAULT }} className="font-inter-medium text-[13px] mr-1.5">
                            Waiting for stock
                        </Text>
                        <HourglassTop width={11} height={14} fill={colors.text.DEFAULT} />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

export default React.memo(PartialOrderCard);
