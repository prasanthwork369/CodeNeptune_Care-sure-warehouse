import React from "react";
import { View } from "react-native";
import Skeleton from "@/src/components/common/Skeleton";

const OrderSkeleton = () => {
  return (
    <View
      className="flex-row items-center bg-white p-4 rounded-2xl mb-4 border"
      style={{
        borderColor: "#EEEEEE",
      }}
    >
      {/* Single image placeholder */}
      <Skeleton
        width={80}
        height={80}
        borderRadius={12}
        style={{ marginRight: 20 }}
      />

      {/* Order info lines */}
      <View className="flex-1">
        <Skeleton
          width={130}
          height={20}
          borderRadius={6}
          style={{ marginBottom: 10 }}
        />
        <Skeleton
          width="80%"
          height={15}
          borderRadius={4}
          style={{ marginBottom: 14 }}
        />
        <Skeleton width={70} height={13} borderRadius={4} />
      </View>

      {/* Arrow placeholder */}
      <Skeleton
        width={18}
        height={18}
        borderRadius={9}
        style={{ marginLeft: 8 }}
      />
    </View>
  );
};

export const OrderSkeletonList = () => (
  <View className="px-5 pt-4">
    {[0, 1, 2, 3, 4].map((i) => (
      <OrderSkeleton key={i} />
    ))}
  </View>
);

export default OrderSkeleton;
