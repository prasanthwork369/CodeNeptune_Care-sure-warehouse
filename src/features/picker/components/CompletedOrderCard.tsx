import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Order } from "@/src/features/picker/types/order.types";
import { icons } from "@/src/constants/icons";
import { colors } from "@/src/theme/colors";

interface CompletedOrderCardProps {
  order: Order;
}

const MAX_IMAGES = 3;

const CompletedOrderCard: React.FC<CompletedOrderCardProps> = ({ order }) => {
  const router = useRouter();
  const Person = icons.person;
  const CalendarClock = icons.calendar_clock;
  const CheckCircle = icons.checkCircle;

  const displayId = order.orderId || order.id;

  const images = order.images ?? [];
  const visibleImages = images.slice(0, MAX_IMAGES);
  const extraCount = images.length - MAX_IMAGES;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() =>
        router.push({ pathname: "/completed/[id]", params: { id: order.id } })
      }
      className="bg-white rounded-2xl mb-4 px-5 pt-5 pb-4"
      style={{ borderWidth: 1, borderColor: "#F0F0F0" }}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text
          style={{ color: colors.text.DEFAULT }}
          className="font-inter-bold text-[20px]"
        >
          #{displayId}
        </Text>
        <Text
          style={{ color: colors.text.secondary }}
          className="text-[13px] font-inter-semibold"
        >
          {order.totalItems ?? 0} Items picked
        </Text>
      </View>

      {/* Divider */}
      <View
        style={{ backgroundColor: "#F0F0F0", height: 1, marginBottom: 14 }}
      />

      {/* Info rows + images */}
      <View className="flex-row">
        {/* Left: info rows */}
        <View style={{ flex: 1 }}>
          {/* Customer Name */}
          <View className="flex-row items-center mb-3">
            <Person
              width={15}
              height={15}
              fill={colors.text.secondary}
              style={{ marginRight: 8 }}
            />
            <View>
              <Text
                style={{ color: colors.text.secondary }}
                className="text-[12px] font-inter-medium"
              >
                Customer Name
              </Text>
              <Text
                style={{ color: colors.text.DEFAULT }}
                className="text-[15px] font-inter-semibold"
              >
                {order.customerName || "N/A"}
              </Text>
            </View>
          </View>

          {/* Order Date & Time */}
          <View className="flex-row items-center mb-3">
            <CalendarClock
              width={15}
              height={15}
              fill={colors.text.secondary}
              style={{ marginRight: 8 }}
            />
            <View>
              <Text
                style={{ color: colors.text.secondary }}
                className="text-[12px] font-inter-medium"
              >
                Order Date & Time
              </Text>
              <Text
                style={{ color: colors.text.DEFAULT }}
                className="text-[15px] font-inter-medium"
              >
                {order.orderDate || order.date || "N/A"}
              </Text>
            </View>
          </View>

          {/* Completion Date */}
          {/* <View className="flex-row items-center">
            <CheckCircle
              width={15}
              height={15}
              fill={colors.text.secondary}
              style={{ marginRight: 8 }}
            />
            <View>
              <Text
                style={{ color: colors.text.secondary }}
                className="text-[12px] font-inter-medium"
              >
                Completion Date
              </Text>
              <Text
                style={{ color: colors.text.DEFAULT }}
                className="text-[15px] font-inter-medium"
              >
                {order.completionDate || "N/A"}
              </Text>
            </View>
          </View> */}
        </View>

        {/* Right: product images */}
        {images.length > 0 && (
          <View className="flex-row items-end ml-3">
            {visibleImages.map((uri, i) => (
              <View
                key={i}
                className="w-[64px] h-[64px] rounded-[12px] items-center justify-center"
                style={{
                  backgroundColor: "#F5F5F5",
                  marginLeft: i === 0 ? 0 : 8,
                }}
              >
                <Image
                  source={{ uri }}
                  style={{ width: 50, height: 50 }}
                  contentFit="contain"
                />
              </View>
            ))}
            {extraCount > 0 && (
              <View
                className="w-[64px] h-[64px] rounded-[12px] items-center justify-center"
                style={{ backgroundColor: "#F0F0F0", marginLeft: 8 }}
              >
                <Text
                  style={{ color: colors.text.secondary }}
                  className="text-[15px] font-inter-semibold"
                >
                  {extraCount}+
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(CompletedOrderCard);
