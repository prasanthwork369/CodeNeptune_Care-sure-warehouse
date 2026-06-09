import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { dispatcherApi } from '@/src/api/dispatcher.api';
import { mapOrder } from '@/src/services/order.service';
import { icons } from '@/src/constants/icons';
import { colors } from '@/src/theme/colors';
import DispatcherOrderCard from '@/src/components/dispatcher/sections/DispatcherOrderCard';
import DispatcherTabs from '@/src/components/dispatcher/sections/DispatcherTabs';

interface AllDispatcherOrdersViewProps {
    initialTab?: 'dispatched' | 'pending';
}

const AllDispatcherOrdersView: React.FC<AllDispatcherOrdersViewProps> = ({ initialTab }) => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'dispatched' | 'pending'>(initialTab || 'dispatched');
    const Search = icons.search;
    const SwapVert = icons.swapVert;

    const { data: allRawOrders = [], isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['dispatched-orders'],
        queryFn: dispatcherApi.getAllDispatcherOrders,
        staleTime: 0,
    });

    const dispatchedOrders = useMemo(() => 
        allRawOrders.filter(o => Number(o.status) === 6).map(mapOrder), 
        [allRawOrders]
    );

    const pendingOrders = useMemo(() => 
        allRawOrders.filter(o => Number(o.status) === 12).map(mapOrder), 
        [allRawOrders]
    );

    const filteredOrders = useMemo(() => {
        const q = searchQuery.toLowerCase();
        const orders = activeTab === 'dispatched' ? dispatchedOrders : pendingOrders;
        
        if (!q) return orders;
        
        return orders.filter(order =>
            order.orderId?.toLowerCase().includes(q) ||
            order.customerName?.toLowerCase().includes(q)
        );
    }, [dispatchedOrders, pendingOrders, activeTab, searchQuery]);

    return (
        <View className="flex-1 bg-[#F8F8F8]">
            {/* Tabs */}
            <View className="bg-white px-5 border-b border-[#F0F0F0]">
                <DispatcherTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </View>

            {/* Search and Sort Bar */}
            <View className="px-5 mb-4 pt-4 flex-row items-center">
                <View className="flex-1 flex-row items-center bg-[#F0F0F0] rounded-xl px-4 py-2">
                    <Search width={20} height={20} stroke="#969696" />
                    <TextInput
                        placeholder="Search order ID or name"
                        placeholderTextColor="#969696"
                        className="flex-1 ml-3 text-[#1A1A1A] text-[14px] font-inter-medium"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity className="ml-4 p-2" onPress={() => refetch()}>
                    <SwapVert width={24} height={24} fill="#6A6A6A" />
                </TouchableOpacity>
            </View>

            {/* Full Orders List */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.brand.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View className="px-5">
                            <DispatcherOrderCard
                                id={item.id}
                                idDisplay={item.orderId}
                                customerName={item.customerName || 'N/A'}
                                reviewedOn={item.orderDate || ''}
                                onPress={() => router.push({ pathname: '/dispatching/order-status', params: { orderId: item.orderId } } as any)}
                            />
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshing={isRefetching}
                    onRefresh={refetch}
                    ListEmptyComponent={() => (
                        <View className="py-20 items-center">
                            <Text style={{ color: colors.text.secondary }} className="font-inter-medium text-[15px]">
                                {searchQuery 
                                    ? 'No orders match your search' 
                                    : activeTab === 'dispatched' 
                                        ? 'No dispatched orders' 
                                        : 'No pending dispatches'}
                            </Text>
                        </View>
                    )}
                    removeClippedSubviews={true}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                />
            )}
        </View>
    );
};

export default AllDispatcherOrdersView;
