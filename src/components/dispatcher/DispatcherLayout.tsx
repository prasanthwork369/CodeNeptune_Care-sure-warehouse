import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { dispatcherApi } from "@/src/api/dispatcher.api";
import { mapOrder } from "@/src/services/order.service";
import { useTabBarStore } from "@/src/store/useTabBarStore";
import { colors } from "@/src/theme/colors";

// Sections
import DispatcherTabs from "./sections/DispatcherTabs";
import DispatcherOrderCard from "./sections/DispatcherOrderCard";
import ScanBanner from "../common/ScanBanner";

export const DispatcherLayout = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dispatched" | "pending">(
    "dispatched",
  );
  const tabBarHeight = useTabBarStore((s) => s.tabBarHeight);

  const {
    data: allRawOrders = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["dispatched-orders"],
    queryFn: dispatcherApi.getAllDispatcherOrders,
    staleTime: 0,
  });

  const isToday = (dateInput: string) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const dispatchedOrders = allRawOrders
    .filter((o) => [6, 7].includes(Number(o.status)) && isToday(o.createdAt))
    .map(mapOrder);
  const pendingOrders = allRawOrders
    .filter((o) => Number(o.status) === 12 && isToday(o.createdAt))
    .map(mapOrder);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-1 bg-[#F7F7F7]">
        {/* White top section */}
        <View className="bg-white px-5 pt-6 pb-6">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-[28px] font-inter-bold text-[#1A1A1A]">
              Dispatcher
            </Text>
          </View>
          <ScanBanner
            title="Scan the QR code to dispatch the order"
            bgColor="#5F7C5B"
            buttonBg="#4F6954"
            buttonTextColor="#FFFFFF"
            onPress={() => router.push("/scanner?context=dispatcher" as any)}
          />
        </View>

        {/* Tabs */}
        <View className="bg-white px-5">
          <DispatcherTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </View>

        {/* Orders list */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: tabBarHeight + 16,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
            />
          }
        >
          {activeTab === "dispatched" ? (
            <>
              <View className="flex-row items-center justify-between mt-5 mb-4">
                <View className="flex-row items-center">
                  <Text className="text-[20px] font-inter-bold text-[#1A1A1A]">
                    Dispatched Today
                  </Text>
                  <Text className="text-[16px] font-inter-medium text-[#6A6A6A] ml-2">
                    ({dispatchedOrders.length})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/dispatching/all-orders",
                      params: { initialTab: "dispatched" },
                    } as any)
                  }
                >
                  <Text
                    style={{ color: colors.text.secondary }}
                    className="text-[14px] font-inter-medium"
                  >
                    View all
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <View className="py-20 items-center">
                  <Text className="text-[#6A6A6A] font-inter-medium text-[15px]">
                    Loading...
                  </Text>
                </View>
              ) : dispatchedOrders.length === 0 ? (
                <View className="py-20 items-center">
                  <Text className="text-[#6A6A6A] font-inter-medium text-[15px]">
                    No dispatched orders
                  </Text>
                </View>
              ) : (
                dispatchedOrders.map((order) => (
                  <DispatcherOrderCard
                    key={order.id}
                    id={order.id}
                    idDisplay={order.orderId}
                    customerName={order.customerName || "N/A"}
                    reviewedOn={order.orderDate || ""}
                  />
                ))
              )}
            </>
          ) : (
            <>
              <View className="flex-row items-center justify-between mt-5 mb-4">
                <View className="flex-row items-center">
                  <Text className="text-[20px] font-inter-bold text-[#1A1A1A]">
                    Dispatch Failed
                  </Text>
                  <Text className="text-[16px] font-inter-medium text-[#6A6A6A] ml-2">
                    ({pendingOrders.length})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/dispatching/all-orders",
                      params: { initialTab: "pending" },
                    } as any)
                  }
                >
                  <Text
                    style={{ color: colors.text.secondary }}
                    className="text-[14px] font-inter-medium"
                  >
                    View all
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <View className="py-20 items-center">
                  <Text className="text-[#6A6A6A] font-inter-medium text-[15px]">
                    Loading...
                  </Text>
                </View>
              ) : pendingOrders.length === 0 ? (
                <View className="py-20 items-center">
                  <Text className="text-[#6A6A6A] font-inter-medium text-[15px]">
                    No pending dispatches
                  </Text>
                </View>
              ) : (
                pendingOrders.map((order) => (
                  <DispatcherOrderCard
                    key={order.id}
                    id={order.id}
                    idDisplay={order.orderId}
                    customerName={order.customerName || "N/A"}
                    reviewedOn={order.orderDate || ""}
                  />
                ))
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};
