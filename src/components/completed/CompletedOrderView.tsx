import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Order } from '@/src/types/order.types';
import { orderService } from '@/src/services/order.service';
import { icons } from '@/src/constants/icons';
import { colors } from '@/src/theme/colors';
import BackButton from '@/src/components/common/BackButton';
import CompletedOrderItemCard from './CompletedOrderItemCard';
import { ItemPickingSkeletonList } from '../picking/ItemPickingSkeleton';

interface CompletedOrderViewProps {
    orderId: string;
}

const CompletedOrderView: React.FC<CompletedOrderViewProps> = ({ orderId }) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const Person = icons.person;
    const EditorChoice = icons.editor_choice;
    const Clock = icons.creditCardClock;

    useEffect(() => {
        loadOrderDetails();
    }, [orderId]);

    const loadOrderDetails = async () => {
        try {
            setLoading(true);
            const data = await orderService.getById(orderId);
            setOrder(data);
        } catch (error: any) {
            if (__DEV__) console.error('[CompletedOrder] Error:', error?.message, '| status:', error?.status, '| data:', JSON.stringify(error?.data));
        } finally {
            setLoading(false);
        }
    };

    const displayOrderId = order?.orderId || orderId;
    const isPacked = order?.pickingItems?.some(item => item.status === 'packed');

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white' }}>
                <BackButton />
                <Text style={{ color: colors.text.DEFAULT }} className="text-[18px] font-inter-bold">
                    Order Completion Details
                </Text>
            </View>

            {loading ? (
                <View className="flex-1 px-5 pt-4 bg-white">
                    <ItemPickingSkeletonList />
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: (insets.bottom || 0) + 40 }}
                >
                    {/* ── Summary card ───────────────────────────────── */}
                    <View style={{ backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, flexDirection: 'row' }}>

                        {/* Left column */}
                        <View style={{ flex: 5, marginRight: 16 }}>
                            {/* Badge + Order ID on same row */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: `${colors.brand.primary}18`, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
                                    <EditorChoice width={32} height={32} fill={colors.brand.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: colors.text.DEFAULT, fontSize: 48, fontFamily: 'Inter_700Bold' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                                        #{displayOrderId}
                                    </Text>
                                    <Text style={{ color: colors.text.secondary, fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 2 }}>
                                        {order?.totalItems ?? 0} items
                                    </Text>
                                </View>
                            </View>
                            {/* Picked by — indented to align with order ID text (badge 58px + gap 12px) */}
                            <View style={{ paddingLeft: 70 }}>
                                <Text style={{ color: colors.text.secondary, fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 3 }}>
                                    Picked by
                                </Text>
                                <Text style={{ color: colors.text.DEFAULT, fontSize: 14, fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>
                                    —
                                </Text>
                            </View>
                        </View>

                        {/* Right column — card style */}
                        <View style={{ flex: 4, backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 4 }}>
                            {/* Customer Name */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12}}>
                                <Person width={16} height={16} fill="#6A6A6A" style={{ marginRight: 10 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#6A6A6A', fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 }}>Customer Name</Text>
                                    <Text style={{ color: colors.text.DEFAULT, fontSize: 14, fontFamily: 'Inter_700Bold' }} numberOfLines={1}>
                                        {order?.customerName || '—'}
                                    </Text>
                                </View>
                            </View>

                            {/* Completion Date */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
                                <Clock width={16} height={16} fill="#6A6A6A" style={{ marginRight: 10 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#6A6A6A', fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 }}>Completion Date</Text>
                                    <Text style={{ color: colors.text.DEFAULT, fontSize: 13, fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>
                                        {order?.completionDate || '—'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* ── Section label ──────────────────────────────── */}
                    <View style={{ paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 }}>
                        <Text style={{ color: colors.text.secondary, fontSize: 14, fontFamily: 'Inter_500Medium' }}>
                            {isPacked ? 'Packed Items' : 'Picked Items'}
                        </Text>
                    </View>

                    {/* ── Items list (white card with side gaps) ──────── */}
                    <View style={{ backgroundColor: 'white', marginHorizontal: 16, borderRadius: 16, paddingHorizontal: 16 }}>
                        {order?.pickingItems?.length ? (
                            order.pickingItems.map((item, index) => (
                                <CompletedOrderItemCard
                                    key={item.id}
                                    item={item}
                                    isLast={index === order.pickingItems!.length - 1}
                                />
                            ))
                        ) : (
                            <View className="py-10 items-center">
                                <Text
                                    style={{ color: colors.text.secondary }}
                                    className="text-[14px] font-inter"
                                >
                                    No items found
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default CompletedOrderView;
