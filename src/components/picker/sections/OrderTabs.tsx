import React, { useMemo } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import OrderCard from './OrderCard';
import PartialOrderCard from './PartialOrderCard';
import CompletedOrderCard from './CompletedOrderCard';
import { Order } from '@/src/types/order.types';
import { useTabBarStore } from '@/src/store/useTabBarStore';
import { icons } from '@/src/constants/icons';

interface TabProps {
    orders: Order[];
    onRefresh?: () => void;
    refreshing?: boolean;
    searchQuery?: string;
}

export const NewOrdersTab: React.FC<TabProps> = ({ orders, onRefresh, refreshing, searchQuery = '' }) => {
    const tabBarHeight = useTabBarStore(s => s.tabBarHeight);
    const filteredOrders = useMemo(() => {
        return orders?.filter(order =>
            order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.items && order.items.some(item => item.toLowerCase().includes(searchQuery.toLowerCase())))
        ) || [];
    }, [orders, searchQuery]);

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <OrderCard order={item} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    { paddingHorizontal: 20, paddingBottom: tabBarHeight + 16 },
                    filteredOrders.length === 0 && { flexGrow: 1, justifyContent: 'center' }
                ]}
                ListEmptyComponent={() => (
                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                        <icons.package width={64} height={64} fill="#CCCCCC" style={{ marginBottom: 16 }} />
                        <Text style={{ color: 'rgba(0,0,0,0.4)', fontFamily: 'Inter-Medium', fontSize: 16 }}>
                            {searchQuery ? 'No orders match your search' : 'No new orders'}
                        </Text>
                    </View>
                )}
                refreshControl={<RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} />}
                removeClippedSubviews={true}
                initialNumToRender={5}
                maxToRenderPerBatch={10}
                windowSize={5}
            />
        </View>
    );
};

export const PartialOrdersTab: React.FC<TabProps> = ({ orders, onRefresh, refreshing, searchQuery = '' }) => {
    const tabBarHeight = useTabBarStore(s => s.tabBarHeight);
    const filteredOrders = useMemo(() => {
        return orders?.filter(order =>
            order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.items && order.items.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()))) ||
            order.medicineSlug?.toLowerCase().includes(searchQuery.toLowerCase())
        ) || [];
    }, [orders, searchQuery]);

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <PartialOrderCard order={item} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    { paddingHorizontal: 20, paddingBottom: tabBarHeight + 16 },
                    filteredOrders.length === 0 && { flexGrow: 1, justifyContent: 'center' }
                ]}
                ListEmptyComponent={() => (
                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                        <icons.package width={64} height={64} fill="#CCCCCC" style={{ marginBottom: 16 }} />
                        <Text style={{ color: 'rgba(0,0,0,0.4)', fontFamily: 'Inter-Medium', fontSize: 16 }}>
                            {searchQuery ? 'No orders match your search' : 'No partial orders'}
                        </Text>
                    </View>
                )}
                refreshControl={<RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} />}
                removeClippedSubviews={true}
                initialNumToRender={5}
                maxToRenderPerBatch={10}
                windowSize={5}
            />
        </View>
    );
};

export const CompletedOrdersTab: React.FC<TabProps> = ({ orders, onRefresh, refreshing, searchQuery = '' }) => {
    const tabBarHeight = useTabBarStore(s => s.tabBarHeight);
    const filteredOrders = useMemo(() => {
        return orders?.filter(order =>
            order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.medicineSlug?.toLowerCase().includes(searchQuery.toLowerCase())
        ) || [];
    }, [orders, searchQuery]);

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <CompletedOrderCard order={item} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    { paddingHorizontal: 20, paddingBottom: tabBarHeight + 16 },
                    filteredOrders.length === 0 && { flexGrow: 1, justifyContent: 'center' }
                ]}
                ListEmptyComponent={() => (
                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                        <icons.checkCircle width={64} height={64} fill="#CCCCCC" style={{ marginBottom: 16 }} />
                        <Text style={{ color: 'rgba(0,0,0,0.4)', fontFamily: 'Inter-Medium', fontSize: 16 }}>
                            No completed orders found
                        </Text>
                    </View>
                )}
                refreshControl={<RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} />}
                removeClippedSubviews={true}
                initialNumToRender={5}
                maxToRenderPerBatch={10}
                windowSize={5}
            />
        </View>
    );
};
