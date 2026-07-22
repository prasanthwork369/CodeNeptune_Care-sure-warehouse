import React, { useState } from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTabBarStore } from '@/src/store/useTabBarStore';
import * as Haptics from 'expo-haptics';

// Hooks & Stores
import { useAuthStore } from '@/src/store/useAuthStore';
import { useHomeQuery } from '@/src/hooks/useHome';

// Sections
import DashboardHeader from './sections/DashboardHeader';
import StatsCard from './sections/StatsCard';
import { HomeSkeletonList } from './sections/HomeSkeleton';

export const HomeLayout: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, isLoaded, roles, permissions } = useAuthStore();
    const { data: warehouseStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useHomeQuery();
    const [refreshing, setRefreshing] = useState(false);
    const isAdmin = roles.includes('admin');
    const hasCheckerAccess    = isAdmin || permissions.includes('checker-panel:read') || permissions.includes('picker-panel:read');
    const hasPickerAccess     = hasCheckerAccess;
    const hasPackerAccess     = isAdmin || permissions.includes('packer-panel:read');
    const hasDispatcherAccess = isAdmin || permissions.includes('dispatcher-panel:read') || permissions.includes('dispatcher-panel:update');

    const tabBarHeight = useTabBarStore(s => s.tabBarHeight);
    const statsList = warehouseStats as unknown as any[] | undefined;
    const isInitialLoading = (statsLoading && !statsList?.length) || (!isLoaded && !user);


    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                refetchStats(),
                useAuthStore.getState().initialize()
            ]);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {
            if (__DEV__) console.error('Failed to refresh home data:', e);
        } finally {
            setRefreshing(false);
        }
    };

    const handleStatPress = (id: string) => {
        if (id === 'picks' && !hasPickerAccess) return;
        if (id === 'packs' && !hasPackerAccess) return;
        if (id === 'dispatch' && !hasDispatcherAccess) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (id === 'picks') navigation.navigate('picker');
        else if (id === 'packs') navigation.navigate('packer');
        else if (id === 'dispatch') navigation.navigate('dispatcher');
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#ccc"
                    />
                }
            >
                {isInitialLoading ? (
                    <HomeSkeletonList />
                ) : (
                    <>
                        <DashboardHeader />

                        {statsError && !warehouseStats?.length && (
                            <View className="mb-4 p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                                <Text className="text-red-400 text-center font-inter-medium">
                                    {(statsError as any)?.message ?? 'Failed to load stats'}
                                </Text>
                            </View>
                        )}

                        {warehouseStats?.map((stat) => (
                            <StatsCard
                                key={stat.id}
                                {...stat}
                                onPress={() => handleStatPress(stat.id)}
                            />
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};
