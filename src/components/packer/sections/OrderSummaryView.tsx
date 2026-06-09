import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { icons } from '@/src/constants/icons';
import { colors } from '@/src/theme/colors';
import { Order, OrderItem } from '@/src/types/order.types';
import { orderService } from '@/src/services/order.service';
import { fulfillmentApi } from '@/src/api/fulfillment.api';
import { useUserQuery } from '@/src/hooks/useUser';
import AppLoader from '@/src/components/common/AppLoader';
import ErrorModal from '@/src/components/common/ErrorModal';
import BackButton from '@/src/components/common/BackButton';
import ItemEditModal from './ItemEditModal';
import GetInvoiceModal from '@/src/components/common/GetInvoiceModal';

interface OrderSummaryViewProps {
    orderId: string;
}

const OrderSummaryView: React.FC<OrderSummaryViewProps> = ({ orderId }) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [editItem, setEditItem] = useState<OrderItem | null>(null);
    const [editReasons, setEditReasons] = useState<Record<string, string>>({});
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [packError, setPackError] = useState<string | null>(null);

    const { data: currentUser } = useUserQuery();
    const pickerFirstName = currentUser?.profile?.firstName || '';
    const pickerLastName = currentUser?.profile?.lastName || '';
    const pickerName = (pickerFirstName + ' ' + pickerLastName).trim() || currentUser?.email || 'Unknown';
    const pickerEmpId = currentUser?.id ? `EMP-${currentUser.id.slice(0, 8).toUpperCase()}` : null;

    const Person = icons.person;

    useEffect(() => { loadOrder(); }, [orderId]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            const data = await orderService.getById(orderId);
            setOrder(data);
        } catch (error) {
            if (__DEV__) console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCheck = (id: string) =>
        setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));

    if (loading) return <AppLoader visible title="Loading order..." subtitle="Please wait a moment" />;

    if (!order) return (
        <View className="flex-1 bg-white items-center justify-center p-10">
            <Text className="text-[18px] font-inter-bold mb-2">Order Not Found</Text>
            <Text className="text-[14px] font-inter text-center mb-8 text-[#666666]">
                We couldn't find any order with ID "#{orderId}"
            </Text>
            <TouchableOpacity className="bg-[#0F7635] px-8 py-3 rounded-full" onPress={() => router.replace('/scanner' as any)}>
                <Text className="text-white font-inter-bold">Scan Again</Text>
            </TouchableOpacity>
        </View>
    );

    // 'partial' = PICKED (status 4) on server — the only packable state
    if (order.status !== 'partial') return (
        <View className="flex-1 bg-white items-center justify-center p-10">
            <Text className="text-[18px] font-inter-bold mb-2" style={{ color: colors.text.DEFAULT }}>
                Order Not Ready
            </Text>
            <Text className="text-[14px] font-inter text-center mb-8" style={{ color: colors.text.secondary }}>
                This order has not been picked yet and cannot be packed.{'\n'}Current status: {order.status}
            </Text>
            <TouchableOpacity className="bg-[#0F7635] px-8 py-3 rounded-full" onPress={() => router.replace('/scanner' as any)}>
                <Text className="text-white font-inter-bold">Scan Again</Text>
            </TouchableOpacity>
        </View>
    );

    const totalItems = order.pickingItems?.length || 0;
    const packedCount = order.pickingItems?.filter(item => checkedItems[item.id] && !editReasons[item.id]).length ?? 0;
    const isAllReviewed = totalItems > 0 &&
        order.pickingItems!.every(item => checkedItems[item.id] || editReasons[item.id]);

    return (
        <View className="flex-1 bg-[#F5F5F5]">
            {/* Header */}
            <View
                style={{ paddingTop: insets.top + 12 }}
                className="px-5 pb-4 flex-row items-center bg-white border-b border-[#EEEEEE]"
            >
                <BackButton />
                <Text className="text-[18px] font-inter-bold" style={{ color: colors.text.DEFAULT }}>
                    Order Summary
                </Text>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: (insets.bottom || 0) + 110 }}
            >
                {/* Order ID + Customer Card */}
                <View className="mx-4 mt-4 mb-3 bg-white rounded-2xl p-5 border border-[#EEEEEE]">
                    <Text className="text-[22px] font-inter-bold mb-4" style={{ color: colors.text.DEFAULT }}>
                        #{order.orderId || orderId}
                    </Text>

                    <View className="flex-row items-center justify-between">
                        {/* Customer */}
                        <View className="flex-row items-center flex-1">
                            <View className="w-11 h-11 rounded-full bg-[#F0F0F0] items-center justify-center mr-3">
                                <Person width={20} height={20} fill="#888" />
                            </View>
                            <View>
                                <Text className="text-[11px] font-inter-medium" style={{ color: colors.text.secondary }}>
                                    Customer Name
                                </Text>
                                <Text className="text-[15px] font-inter-semibold" style={{ color: colors.text.DEFAULT }}>
                                    {order.customerName || 'N/A'}
                                </Text>
                            </View>
                        </View>

                        {/* Picked by */}
                        <View>
                            <Text className="text-[11px] font-inter-medium mb-1" style={{ color: colors.text.secondary }}>
                                Picked by
                            </Text>
                            <View className="flex-row items-center" style={{ gap: 10 }}>
                                <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.text.DEFAULT }}>
                                    {pickerName}
                                </Text>
                                {/* {pickerEmpId && (
                                    <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.secondary }}>
                                        {pickerEmpId}
                                    </Text>
                                )} */}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Section Label */}
                <Text className="px-4 text-[13px] font-inter-medium mb-3" style={{ color: colors.text.secondary }}>
                    Ordered Items
                </Text>

                {/* Item Cards */}
                <View className="px-4">
                    {order.pickingItems?.map((item: OrderItem) => {
                        const checked = !!checkedItems[item.id];
                        const reason = editReasons[item.id];
                        const isEdited = !!reason;
                        const cardBg = (checked || isEdited) ? '#BBE0C9' : '#FFFFFF';
                        const cardBorder = (checked || isEdited) ? colors.border.success : '#EBEBEB';
                        const tagBg = (checked || isEdited) ? '#DAF5E3' : '#F2F2F2';
                        return (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.85}
                                onPress={() => { if (!isEdited) toggleCheck(item.id); }}
                                className="rounded-[20px] mb-5 overflow-hidden"
                                style={{ backgroundColor: cardBg, borderWidth: 0.5, borderColor: cardBorder }}
                            >
                                <View style={{ padding: 16, paddingBottom: isEdited ? 20 : 16 }}>
                                    <View className="flex-row items-center">
                                        {/* Image */}
                                        <View
                                            style={{ backgroundColor: '#F0F0F0' }}
                                            className="w-[120px] h-[120px] rounded-[12px] items-center justify-center"
                                        >
                                            {item.image ? (
                                                <Image
                                                    source={{ uri: item.image }}
                                                    style={{ width: 88, height: 88 }}
                                                    contentFit="contain"
                                                    contentPosition="center"
                                                />
                                            ) : (
                                                <icons.picker width={28} height={28} stroke={colors.text.muted} />
                                            )}
                                        </View>

                                        {/* Right column */}
                                        <View className="flex-1 ml-4 justify-between">
                                            {/* Name + action icon */}
                                            <View className="flex-row justify-between items-start">
                                                <View className="flex-1 mr-2">
                                                    <Text style={{ color: colors.text.DEFAULT }} className="font-inter-bold text-[18px] leading-6">
                                                        {item.name}
                                                    </Text>
                                                    <Text style={{ color: colors.text.secondary }} className="text-[13px] font-inter mt-0.5">
                                                        {item.manufacturer || 'Pfizer Inc.'}
                                                    </Text>
                                                    <Text style={{ color: colors.text.DEFAULT }} className="text-[12px] font-inter mt-0.5">
                                                        {item.description || ''}
                                                    </Text>
                                                </View>
                                                {/* Reset icon when edited, checkbox when not */}
                                                {isEdited ? (
                                                    <TouchableOpacity
                                                        onPress={() => setEditReasons(prev => { const next = { ...prev }; delete next[item.id]; return next; })}
                                                        style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <icons.refresh width={20} height={20} fill={colors.text.secondary} />
                                                    </TouchableOpacity>
                                                ) : (
                                                    <TouchableOpacity
                                                        onPress={() => toggleCheck(item.id)}
                                                        style={{
                                                            width: 24, height: 24, borderRadius: 4,
                                                            borderWidth: 2,
                                                            borderColor: colors.brand.primary,
                                                            backgroundColor: checked ? colors.brand.primary : 'transparent',
                                                            alignItems: 'center', justifyContent: 'center',
                                                        }}
                                                    >
                                                        {checked && (
                                                            <icons.checkmarkPure width={14} height={14} fill="white" />
                                                        )}
                                                    </TouchableOpacity>
                                                )}
                                            </View>

                                            {/* Batch / EXP */}
                                            <View className="flex-row items-center mt-2">
                                                <View style={{ backgroundColor: tagBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 }}>
                                                    <Text style={{ color: colors.text.secondary }} className="text-[11px] font-inter-semibold">
                                                        Batch No: {item.batchNo || 'B12345'}
                                                    </Text>
                                                </View>
                                                <View style={{ backgroundColor: tagBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                                                    <Text style={{ color: colors.text.secondary }} className="text-[11px] font-inter-semibold">
                                                        EXP {item.expiryDate || '05/2026'}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Qty + Edit button */}
                                            <View className="flex-row justify-between items-end mt-1">
                                                <View className="flex-row items-baseline">
                                                    <Text style={{ color: colors.brand.primary }} className="text-[44px] font-inter-bold">
                                                        {item.requiredQty}
                                                    </Text>
                                                    <Text style={{ color: colors.text.DEFAULT }} className="text-[13px] font-inter-medium ml-2">
                                                        Ordered Units
                                                    </Text>
                                                </View>
                                                {!isEdited && (
                                                    <TouchableOpacity
                                                        onPress={() => setEditItem(item)}
                                                        style={{ backgroundColor: '#DCDEDC' }}
                                                        className="flex-row items-center px-3 py-2 rounded-[8px]"
                                                    >
                                                        <Text className="text-[13px] font-inter-medium text-[#222222] mr-1">Edit</Text>
                                                        <icons.arrow_drop_down width={12} height={12} fill="#222222" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    </View>

                                    {/* Edit reason footer — shown after editing */}
                                    {isEdited && (
                                        <>
                                            <View style={{ height: 1, backgroundColor: '#A8D4B8', marginLeft: 136, marginTop: 12 }} />
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 136, marginTop: 12 }}>
                                                <Text style={{ color: colors.text.DEFAULT, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
                                                    {reason}
                                                </Text>
                                                <Text style={{ color: '#222222', fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>
                                                    Edited
                                                </Text>
                                            </View>
                                        </>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Bottom Bar */}
            <View
                className="absolute left-0 right-0 border-t border-[#EEEEEE]"
                style={{ bottom: 0, paddingTop: 16, paddingHorizontal: 20, paddingBottom: (insets.bottom || 0) + 16, backgroundColor: '#E5D6BE' }}
            >
                <View className="flex-row items-center justify-between">
                    <Text className="text-[16px] font-inter-medium" style={{ color: colors.text.DEFAULT }}>
                        Packed Items{' '}
                        <Text className="font-inter-bold">({packedCount}/{totalItems})</Text>
                    </Text>
                    <TouchableOpacity
                        className="h-[52px] px-8 rounded-lg items-center justify-center"
                        style={{
                            backgroundColor: colors.brand.primary,
                            opacity: (!isAllReviewed || submitting) ? 0.4 : 1,
                        }}
                        onPress={() => {
                            if (submitting || !isAllReviewed) return;
                            setShowInvoiceModal(true);
                        }}
                        disabled={submitting || !isAllReviewed}
                    >
                        <Text className="text-white text-[15px] font-inter-bold">
                            {submitting ? 'Submitting...' : 'Move to Dispatcher'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ItemEditModal
                isVisible={!!editItem}
                itemName={editItem?.name}
                onClose={() => setEditItem(null)}
                onConfirm={(reason) => {
                    if (editItem?.id) {
                        setEditReasons(prev => ({ ...prev, [editItem.id]: reason }));
                    }
                    setEditItem(null);
                }}
            />

            <GetInvoiceModal
                isVisible={showInvoiceModal}
                totalItems={totalItems}
                isLoading={submitting}
                onClose={() => { if (!submitting) setShowInvoiceModal(false); }}
                onConfirm={async () => {
                    if (submitting || !order?.pickingItems) return;
                    setSubmitting(true);
                    try {
                        // 1. Submit quality checks for flagged items
                        const checks = Object.entries(editReasons).map(([orderItemId, reason]) => ({
                            orderItemId,
                            reason,
                            notes: 'Flagged by packer during fulfillment',
                        }));
                        if (checks.length > 0) {
                            await fulfillmentApi.submitQualityChecks(order.id, checks);
                        }

                        // 2. Submit pack — flagged items get 0, confirmed items get requiredQty
                        const items = order.pickingItems!.map(item => ({
                            orderItemId: item.id,
                            packedQuantity: editReasons[item.id] ? 0 : item.requiredQty,
                        }));
                        // confirmPartial: true because the order may have shortfall items from picking
                        await fulfillmentApi.pack(order.id, items, true);

                        setShowInvoiceModal(false);
                        queryClient.invalidateQueries({ queryKey: ['home-stats'] });
                        queryClient.invalidateQueries({ queryKey: ['packer-packed-today'] });
                        queryClient.invalidateQueries({ queryKey: ['packer-packed'] });
                        queryClient.invalidateQueries({ queryKey: ['dispatched-orders'] });
                        router.push({
                            pathname: '/packing/success',
                            params: { orderId: order.orderId || order.id, totalItems },
                        } as any);
                    } catch (err: any) {
                        const status = err?.response?.status;
                        const data = err?.response?.data;
                        if (__DEV__) console.error('[Pack] Error:', err?.message, '| status:', status, '| data:', JSON.stringify(data));
                        const message = data?.message || err?.message || 'Something went wrong. Please try again.';
                        setShowInvoiceModal(false);
                        setPackError(message);
                    } finally {
                        setSubmitting(false);
                    }
                }}
            />
            <ErrorModal
                visible={!!packError}
                title="Packing Failed"
                message={packError || ''}
                onRetry={() => { setPackError(null); setShowInvoiceModal(true); }}
                onDismiss={() => setPackError(null)}
            />
        </View>
    );
};

export default OrderSummaryView;
