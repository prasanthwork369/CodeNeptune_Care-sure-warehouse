import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/src/theme/colors';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/src/api/order.api';
import { mapOrder } from '@/src/services/order.service';
import { useTabBarStore } from '@/src/store/useTabBarStore';
import { Order } from '@/src/types/order.types';

// Sections
import PackedOrderCard from './sections/PackedOrderCard';
import ScanBanner from '../common/ScanBanner';

export const PackerLayout = () => {
    const router = useRouter();
    const tabBarHeight = useTabBarStore(s => s.tabBarHeight);

    const { data: packedOrders = [], isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['checker-packed-today'],
        queryFn: async () => {
            const today = new Date();
            const raw = await orderApi.listPacked();
            return raw.filter(o => {
                const d = new Date(o.createdAt);
                return !isNaN(d.getTime()) &&
                    d.getDate() === today.getDate() &&
                    d.getMonth() === today.getMonth() &&
                    d.getFullYear() === today.getFullYear();
            }).map(mapOrder);
        },
        staleTime: 0,
    });

    const renderCard = useCallback(({ item, index }: { item: Order; index: number }) => (
        <PackedOrderCard
            order={item}
            isLast={index === packedOrders.length - 1}
        />
    ), [packedOrders.length]);

    const keyExtractor = useCallback((item: Order) => item.id, []);

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="flex-1 bg-[#F7F7F7]">
                {/* White top section */}
                <View className="bg-white px-5 pt-6 pb-6">
                    <View className="mb-5">
                        <Text style={{ color: colors.text.DEFAULT }} className="text-[28px] font-inter-bold">
                            Checker
                        </Text>
                    </View>
                    <ScanBanner
                        title="Scan the QR code to fetch order details"
                        bgColor="#DE8181"
                        buttonBg="#B26868"
                    />
                </View>

                {/* Gray orders section */}
                <View className="flex-1">
                    <View className="px-5 pt-5 pb-3 flex-row items-center justify-between">
                        <View>
                            <Text style={{ color: colors.text.DEFAULT }} className="text-[20px] font-inter-bold">
                                Packed Orders
                            </Text>
                            <Text style={{ color: colors.text.secondary }} className="text-[14px] font-inter mt-0.5">
                                Today
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/packing/all-orders')}>
                            <Text style={{ color: colors.text.secondary }} className="text-[14px] font-inter-medium">
                                View all
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* White list container */}
                    <View className="flex-1 mx-5 rounded-[16px] overflow-hidden">
                        <FlatList
                            data={isLoading ? [] : packedOrders}
                            renderItem={renderCard}
                            keyExtractor={keyExtractor}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
                            initialNumToRender={10}
                            maxToRenderPerBatch={10}
                            windowSize={5}
                            removeClippedSubviews
                            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                            ListEmptyComponent={
                                isLoading ? (
                                    <View className="py-10 items-center">
                                        <Text style={{ color: colors.text.secondary }} className="font-inter text-[14px]">Loading...</Text>
                                    </View>
                                ) : (
                                    <View className="py-10 items-center">
                                        <Text style={{ color: colors.text.secondary }} className="font-inter text-[14px]">No packed orders today</Text>
                                    </View>
                                )
                            }
                        />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};
