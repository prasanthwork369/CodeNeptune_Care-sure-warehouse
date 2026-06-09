import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import BackButton from '@/src/components/common/BackButton';
import AllDispatcherOrdersView from '@/src/components/dispatcher/sections/AllDispatcherOrdersView';
import { colors } from '@/src/constants/colors';

const AllDispatcherOrders = () => {
    const { initialTab } = useLocalSearchParams<{ initialTab?: 'dispatched' | 'pending' }>();

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="flex-row items-center px-5 py-4 bg-white border-b border-[#F0F0F0]">
                <BackButton />
                <Text className="text-[18px] font-inter-bold" style={{ color: colors.textMain }}>
                    Dispatcher Orders
                </Text>
            </View>
            <AllDispatcherOrdersView initialTab={initialTab} />
        </SafeAreaView>
    );
};

export default AllDispatcherOrders;
