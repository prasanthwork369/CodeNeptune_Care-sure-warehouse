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
import { HomeSkeletonList } from "../components/HomeSkeleton";
import { pushNotificationService } from "@/src/services/pushNotification.service";

export const HomeLayout: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, isLoaded, roles, permissions } = useAuthStore();

  const [isFocused, setIsFocused] = useState(true);
  const {
    data: warehouseStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useHomeQuery({ isFocused });

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
  const isAdmin = roles.includes("admin");
  const hasPickerAccess = isAdmin || permissions.includes("picker-panel:read");
  const hasCheckerAccess =
    isAdmin ||
    roles.includes("checker") ||
    permissions.includes("checker-panel:read");
  const hasDispatcherAccess =
    isAdmin ||
    permissions.includes("dispatcher-panel:read") ||
    permissions.includes("dispatcher-panel:update");

  const tabBarHeight = useTabBarStore((s) => s.tabBarHeight);
  const statsList = warehouseStats as unknown as any[] | undefined;
  const isInitialLoading =
    (statsLoading && !statsList?.length) || (!isLoaded && !user);

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

  const handleStatPress = (id: string) => {
    if (id === "picks" && !hasPickerAccess) return;
    if (id === "packs" && !hasCheckerAccess) return;
    if (id === "dispatch" && !hasDispatcherAccess) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (id === "picks") navigation.navigate("picker");
    else if (id === "packs") navigation.navigate("checker");
    else if (id === "dispatch") navigation.navigate("dispatcher");
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
                  {(statsError as any)?.message ?? "Failed to load stats"}
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

export default HomeLayout;
