import React, { useCallback, useEffect, useState } from "react";
import {
  InteractionManager,
  ScrollView,
  View,
  Text,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTabBarStore } from "@/src/store/useTabBarStore";
import * as Haptics from "expo-haptics";

// Hooks & Stores
import { useAuthStore } from "@/src/store/useAuthStore";
import { useHomeQuery } from "../hooks/useHome";

// Sections
import DashboardHeader from "../components/DashboardHeader";
import StatsCard from "../components/StatsCard";
import StatsScopeTabs from "../components/StatsScopeTabs";
import { StatsScope } from "../types/home";
import { HomeSkeletonList } from "../components/HomeSkeleton";
import { pushNotificationService } from "@/src/services/pushNotification.service";
import { canAccessTab, PanelTab } from "@/src/utils/tabAccess";

// Stat card id → the tab it opens.
const STAT_TAB: Record<string, PanelTab> = {
  picks: "picker",
  packs: "checker",
  dispatch: "dispatcher",
};

export const HomeLayout: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, isLoaded, roles, permissions } = useAuthStore();

  const [isFocused, setIsFocused] = useState(true);
  const [scope, setScope] = useState<StatsScope>("warehouse");
  const {
    data: warehouseStats,
    isLoading: statsLoading,
    isPlaceholderData: isSwitchingScope,
    error: statsError,
    refetch: refetchStats,
  } = useHomeQuery({ isFocused, scope });

  // Refresh stats each time Home gains focus. cancelRefetch: false joins a
  // fetch already in flight (e.g. the initial mount load) instead of starting
  // a second request.
  useFocusEffect(
    useCallback(() => {
      refetchStats({ cancelRefetch: false });
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [refetchStats]),
  );
  const [refreshing, setRefreshing] = useState(false);

  const tabBarHeight = useTabBarStore((s) => s.tabBarHeight);
  // isLoading is only true before the first data arrives.
  const isInitialLoading = statsLoading || (!isLoaded && !user);

  useEffect(() => {
    // Let Home paint and navigation animations finish before showing the
    // operating-system notification permission dialog.
    const task = InteractionManager.runAfterInteractions(() => {
      void pushNotificationService
        .registerForPushAsync()
        .then((token) => {
          if (token && __DEV__) console.log("Expo Push Token:", token);
        })
        .catch((error) => {
          if (__DEV__)
            console.warn("Failed to register for push notifications:", error);
        });
    });

    return () => task.cancel();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchStats(), useAuthStore.getState().initialize()]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      if (__DEV__) console.error("Failed to refresh home data:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const canOpenStat = (id: string) => {
    const tab = STAT_TAB[id];
    return !!tab && canAccessTab(tab, roles, permissions);
  };

  const handleStatPress = (id: string) => {
    if (!canOpenStat(id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate(STAT_TAB[id]);
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

            <StatsScopeTabs value={scope} onChange={setScope} />

            {statsError && !warehouseStats?.length && (
              <View className="mb-4 p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                <Text className="text-red-400 text-center font-inter-medium">
                  {(statsError as any)?.message ?? "Failed to load stats"}
                </Text>
              </View>
            )}

            {/* Previous scope's numbers stay dimmed until the new scope loads. */}
            <View style={{ opacity: isSwitchingScope ? 0.5 : 1 }}>
              {warehouseStats?.map((stat) => (
                <StatsCard
                  key={stat.id}
                  {...stat}
                  disabled={!canOpenStat(stat.id)}
                  onPress={() => handleStatPress(stat.id)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeLayout;
