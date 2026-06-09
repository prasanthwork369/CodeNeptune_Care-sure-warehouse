import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { OrderItem, BatchRow } from '@/src/types/order.types';
import { icons } from '@/src/constants/icons';
import { colors } from '@/src/theme/colors';

interface OrderItemCardProps {
    item: OrderItem;
    batches?: BatchRow[];
    onToggleStatus: (id: string, status: 'pending' | 'partial' | 'completed') => void;
    onPartialPress?: (item: OrderItem) => void;
    onBatchPress?: (item: OrderItem) => void;
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({ item, batches, onToggleStatus, onPartialPress, onBatchPress }) => {
    const isCompleted = item.status === 'completed';
    const isPartial = item.status === 'partial';
    const isBatched = !!batches && batches.length > 0;
    const [showOptions, setShowOptions] = useState(false);

    const cardBg = isBatched || isCompleted
        ? '#BBE0C9'
        : isPartial
        ? '#E0D6AF'
        : '#FFFFFF';

    const cardBorder = isBatched || isCompleted
        ? colors.border.success
        : isPartial
        ? colors.border.warning
        : '#EBEBEB';

    const tagBg = isPartial ? '#F5F5DA' : (isBatched || isCompleted) ? '#DAF5E3' : '#F2F2F2';
    const qtyColor = isPartial ? colors.status.warning : colors.brand.primary;

    const totalBatchQty = isBatched
        ? batches!.reduce((sum, b) => sum + (parseInt(b.quantity) || 0), 0)
        : 0;

    const handleCardPress = () => {
        if (isBatched || isPartial) return;
        onToggleStatus(item.id, isCompleted ? 'pending' : 'completed');
    };

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCardPress}
            className="p-4 rounded-[20px] mb-5"
            style={{
                backgroundColor: cardBg,
                borderWidth: 0.5,
                borderColor: cardBorder,
                shadowColor: 'transparent',
                elevation: 0,
                zIndex: showOptions ? 100 : 1,
            }}
        >
            <View className="flex-row items-center">
                {/* Left Column: Image */}
                <View
                    style={{ backgroundColor: '#F0F0F0' }}
                    className="w-[120px] h-[120px] rounded-[12px] items-center justify-center"
                >
                    {item.image ? (
                        <Image
                            source={{ uri: item.image }}
                            style={{ width: 88, height: 88, alignSelf: 'center' }}
                            contentFit="contain"
                            contentPosition="center"
                        />
                    ) : (
                        <icons.picker width={28} height={28} stroke={colors.text.muted} />
                    )}
                </View>

                {/* Right Column */}
                <View className="flex-1 ml-4 justify-between">
                    {/* Name row + icons */}
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1 mr-2">
                            <Text style={{ color: colors.text.DEFAULT }} className="font-inter-bold text-[18px] leading-6">
                                {item.name}
                            </Text>
                            <Text style={{ color: colors.text.secondary }} className="text-[13px] font-inter mt-0.5">
                                {item.manufacturer || 'Pfizer Inc.'}
                            </Text>
                            <Text style={{ color: colors.text.DEFAULT }} className="text-[12px] font-inter mt-0.5">
                                {item.description || '15 tablets per strip'}
                            </Text>
                        </View>

                        {/* Status icons */}
                        <View className="flex-row items-center mt-1">
                            {/* Refresh — reset to pending (batch/partial only) */}
                            {(isBatched || isPartial) && (
                                <TouchableOpacity
                                    onPress={() => onToggleStatus(item.id, 'pending')}
                                    className="p-1"
                                >
                                    <icons.refresh width={18} height={18} fill={
                                        isPartial ? colors.status.warning : colors.brand.primary
                                    } />
                                </TouchableOpacity>
                            )}

                            {/* Pencil — re-edit partial qty */}
                            {isPartial && (
                                <TouchableOpacity onPress={() => onPartialPress?.(item)} className="p-1 ml-2">
                                    <icons.edit width={18} height={18} fill={colors.status.warning} />
                                </TouchableOpacity>
                            )}

                            {/* Pencil — re-edit batch */}
                            {isBatched && (
                                <TouchableOpacity onPress={() => onBatchPress?.(item)} className="p-1 ml-2">
                                    <icons.edit width={18} height={18} fill={colors.brand.primary} />
                                </TouchableOpacity>
                            )}

                            {/* Checkbox — pending only */}
                            {!isBatched && !isPartial && !isCompleted && (
                                <TouchableOpacity
                                    onPress={() => onToggleStatus(item.id, 'completed')}
                                >
                                    <View style={{ borderColor: colors.brand.primary, borderRadius: 3 }} className="w-[24px] h-[24px] border-[2px]" />
                                </TouchableOpacity>
                            )}

                            {/* Completed checkmark (non-batched) */}
                            {!isBatched && isCompleted && (
                                <TouchableOpacity onPress={() => onToggleStatus(item.id, 'pending')}>
                                    <View style={{ backgroundColor: colors.brand.primary, borderRadius: 4 }} className="w-[24px] h-[24px] items-center justify-center">
                                        <Ionicons name="checkmark" size={18} color="white" />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Batch rows (when batched) */}
                    {isBatched ? (
                        <View className="mt-3">
                            {batches!.map((b) => (
                                <View key={b.id} className="flex-row items-center justify-between mb-2">
                                    <View className="flex-row items-center flex-1 mr-2">
                                        <View style={{ backgroundColor: tagBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, overflow: 'hidden' }}>
                                            <Text style={{ color: colors.text.secondary, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                                                Batch No: {b.batchNo}
                                            </Text>
                                        </View>
                                        <View style={{ backgroundColor: tagBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden' }}>
                                            <Text style={{ color: colors.text.secondary, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                                                EXP {item.expiryDate || '05/2026'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={{ color: colors.brand.primary }} className="text-[20px] font-inter-bold">
                                        {b.quantity || '0'}
                                    </Text>
                                </View>
                            ))}

                            {/* Totals footer */}
                            <View className="flex-row items-center mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border.success }}>
                                <Text style={{ color: colors.brand.primary }} className="text-[30px] font-inter-bold">
                                    {item.requiredQty}
                                </Text>
                                <Text style={{ color: colors.text.DEFAULT }} className="text-[15px] font-inter-medium ml-1.5">
                                    Ordered Units
                                </Text>
                                <View style={{ width: 0.8, height: 18, backgroundColor: colors.border.DEFAULT, opacity: 0.35, marginHorizontal: 12 }} />
                                <Text style={{ color: colors.brand.primary }} className="text-[30px] font-inter-bold">
                                    {totalBatchQty}
                                </Text>
                                <Text style={{ color: colors.text.DEFAULT }} className="text-[15px] font-inter-medium ml-1.5">
                                    Total taken
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <>
                            {/* Single tag row */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                                <View style={{ backgroundColor: tagBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden' }}>
                                    <Text style={{ color: colors.text.secondary, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                                        Batch No: {item.batchNo || 'B12345'}
                                    </Text>
                                </View>
                                <View style={{ backgroundColor: tagBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden' }}>
                                    <Text style={{ color: colors.text.secondary, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                                        EXP {item.expiryDate || '05/2026'}
                                    </Text>
                                </View>
                            </View>

                            {/* Qty + Edit */}
                            <View className="flex-row justify-between items-end">
                                <View className="flex-row items-baseline">
                                    <Text style={{ color: qtyColor }} className="text-[44px] font-inter-bold">
                                        {isPartial ? item.pickedQty : item.requiredQty}
                                    </Text>
                                    <Text style={{ color: colors.text.DEFAULT }} className="text-[13px] font-inter-medium ml-2">
                                        Units Required
                                    </Text>
                                </View>

                                {!isCompleted && !isPartial && (
                                    <View style={{ zIndex: 1000 }}>
                                        <TouchableOpacity
                                            onPress={() => setShowOptions(!showOptions)}
                                            style={{ backgroundColor: '#DCDEDC' }}
                                            className="flex-row items-center px-3 py-2 rounded-[8px]"
                                        >
                                            <Text className="text-[13px] font-inter-medium text-[#222222] mr-1">Edit</Text>
                                            <icons.arrow_drop_down width={12} height={12} fill="#222222" />
                                        </TouchableOpacity>

                                        {showOptions && (
                                            <View style={{
                                                position: 'absolute', top: 38, right: 0,
                                                backgroundColor: '#E0E0E0', borderRadius: 12, width: 140,
                                                zIndex: 2000,
                                                shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.1, shadowRadius: 10, elevation: 10,
                                            }}>
                                                <TouchableOpacity
                                                    onPress={() => { setShowOptions(false); onPartialPress?.(item); }}
                                                    className="py-3 px-4 border-b border-[#CCCCCC]"
                                                >
                                                    <Text className="text-[14px] font-inter-bold text-[#333333]">Partial</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => { setShowOptions(false); onBatchPress?.(item); }}
                                                    className="py-3 px-4"
                                                >
                                                    <Text className="text-[14px] font-inter-bold text-[#333333]">Batch</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        </>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default React.memo(OrderItemCard);
