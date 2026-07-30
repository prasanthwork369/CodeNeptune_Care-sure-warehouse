import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { OrderItem } from "@/src/types/order.types";
import { icons } from "@/src/constants/icons";
import { colors } from "@/src/theme/colors";

interface CompletedOrderItemCardProps {
  item: OrderItem;
  reason?: string;
  isLast?: boolean;
}

const CompletedOrderItemCard: React.FC<CompletedOrderItemCardProps> = ({
  item,
  reason,
  isLast,
}) => {
  return (
    <View
      className="flex-row items-center bg-white py-5"
      style={
        isLast
          ? undefined
          : { borderBottomWidth: 1, borderColor: colors.border.light }
      }
    >
      {/* Product Image */}
      <View
        className="w-[60px] h-[60px] rounded-[12px] items-center justify-center mr-4"
        style={{ backgroundColor: "#F5F5F5" }}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: 46, height: 46 }}
            contentFit="contain"
          />
        ) : (
          <icons.picker width={28} height={28} stroke={colors.text.muted} />
        )}
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text
          style={{ color: colors.text.DEFAULT }}
          className="font-inter-semibold text-[16px] leading-5"
        >
          {item.name}
        </Text>
        {!!item.manufacturer && (
          <Text
            style={{ color: colors.text.secondary }}
            className="text-[14px] font-inter mt-1"
          >
            {item.manufacturer}
          </Text>
        )}
        {reason ? (
          <Text
            style={{ color: "#2E7D5E" }}
            className="text-[13px] font-inter-medium mt-1"
          >
            {reason}
          </Text>
        ) : null}
      </View>

      {/* Quantity */}
      <Text
        style={{ color: colors.text.secondary }}
        className="text-[15px] font-inter-medium ml-3"
      >
        {item.requiredQty} Units
      </Text>
    </View>
  );
};

export default React.memo(CompletedOrderItemCard);
