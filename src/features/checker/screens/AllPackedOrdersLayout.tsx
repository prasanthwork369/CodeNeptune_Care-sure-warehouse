import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { orderApi } from "@/src/features/picker/api/order.api";
import { mapOrder } from "@/src/features/picker/services/order.service";
import { icons } from "@/src/constants/icons";
import { colors } from "@/src/theme/colors";
import BackButton from "@/src/components/common/BackButton";
import PackedOrderCard from "../components/PackedOrderCard";

export const AllPackedOrdersLayout = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const Search = icons.search;
  const SwapVert = icons.swapVert;

  const {
    data: packedOrders = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["checker-packed"],
    queryFn: async () => (await orderApi.listPacked()).map(mapOrder),
  });

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return packedOrders.filter(
      (order) =>
        order.orderId?.toLowerCase().includes(q) ||
        order.customerName?.toLowerCase().includes(q),
    );
  }, [packedOrders, searchQuery]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Top Header */}
      <View className="flex-row items-center px-5 py-4 bg-white">
        <BackButton />
        <Text
          className="text-[18px] font-inter-bold"
          style={{ color: colors.text.DEFAULT }}
        >
          Packed Orders
        </Text>
      </View>

      <View className="flex-1 bg-[#F8F8F8]">
        {/* Search and Sort Bar */}
        <View className="px-5 mb-4 pt-4 flex-row items-center">
          <View className="flex-1 flex-row items-center bg-[#F0F0F0] rounded-xl px-4 py-2">
            <Search width={20} height={20} stroke="#969696" />
            <TextInput
              placeholder="Search order ID or name"
              placeholderTextColor="#969696"
              className="flex-1 ml-3 text-[#969696] text-[14px] font-inter-medium"
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
            renderItem={({ item, index }) => (
              <PackedOrderCard
                order={item}
                isLast={index === filteredOrders.length - 1}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 100,
            }}
            refreshing={isRefetching}
            onRefresh={refetch}
            ListEmptyComponent={() => (
              <View className="py-20 items-center">
                <Text
                  style={{ color: colors.text.secondary }}
                  className="font-inter-medium text-[15px]"
                >
                  {searchQuery
                    ? "No orders match your search"
                    : "No packed orders"}
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
    </SafeAreaView>
  );
};

export default AllPackedOrdersLayout;
