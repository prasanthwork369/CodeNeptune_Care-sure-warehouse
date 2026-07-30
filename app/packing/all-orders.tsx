import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "@/src/components/common/BackButton";
import AllPackedOrdersView from "@/src/components/packer/sections/AllPackedOrdersView";
import { colors } from "@/src/constants/colors";

const AllPackedOrders = () => {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center px-5 py-4 bg-white">
        <BackButton />
        <Text
          className="text-[18px] font-inter-bold"
          style={{ color: colors.textMain }}
        >
          Packed Orders
        </Text>
      </View>
      <AllPackedOrdersView />
    </SafeAreaView>
  );
};

export default AllPackedOrders;
