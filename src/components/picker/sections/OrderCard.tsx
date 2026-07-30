import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Order } from "@/src/types/order.types";
import { icons } from "@/src/constants/icons";
import { colors } from "@/src/theme/colors";
import TimeAgo from "../../common/TimeAgo";

interface OrderCardProps {
  order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const router = useRouter();
  const [claiming] = useState(false);

  const handlePress = () => {
    if (claiming) return;
    // Navigate immediately — claim is handled on mount in OrderPickingView
    router.push({
      pathname: "/order/[id]",
      params: { id: order.id, orderId: order.orderId || order.id },
    });
  };

  const ArrowForward = icons.arrowForward;
  const medicineImages = order.images || [];

  // Helper to render the image grid (up to 4 images)
  const renderImageGrid = () => {
    if (medicineImages.length === 0) {
      return (
        <View
          style={{ backgroundColor: colors.surface.gray }}
          className="w-28 h-28 rounded-xl items-center justify-center"
        >
          <icons.picker width={24} height={24} stroke={colors.text.muted} />
        </View>
      );
    }

    const displayImages = medicineImages.slice(0, 4);
    const count = displayImages.length;

    // 1 image: full square
    // 2 images: two squares side by side (top-aligned)
    // 3-4 images: 2×2 grid
    const itemWidth = count === 1 ? "100%" : "48%";
    const itemHeight = count === 1 ? "100%" : "48%";

    return (
      <View
        style={{
          width: 112,
          height: 112,
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignContent: count === 2 ? "center" : "space-between",
        }}
      >
        {displayImages.map((img, idx) => (
          <View
            key={idx}
            style={{
              width: itemWidth,
              height: itemHeight,
              marginBottom: count > 2 && idx < 2 ? "4%" : 0,
              borderRadius: 6,
              overflow: "hidden",
              backgroundColor: colors.surface.gray,
            }}
          >
            <Image
              source={{ uri: img }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
        ))}
      </View>
    );
  };

  // Build label using a character budget — fit as many names as possible then "+N items"
  const CHAR_BUDGET = 32;
  const nameArr =
    order.items && order.items.length > 0
      ? order.items
      : (order.medicineSlug || "").split(", ").filter(Boolean);
  let used = 0;
  let shown = 0;
  for (const name of nameArr) {
    const cost = name.length + (shown > 0 ? 2 : 0); // 2 for ", " separator
    if (used + cost > CHAR_BUDGET) break;
    used += cost;
    shown++;
  }
  if (shown === 0 && nameArr.length > 0) shown = 1; // always show at least one name
  const visibleNames = nameArr.slice(0, shown).join(", ");
  const extra = nameArr.length - shown;
  const medicineLabel =
    nameArr.length === 0
      ? "No items"
      : extra > 0
        ? `${visibleNames} +${extra} items`
        : visibleNames;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={claiming}
      className="flex-row bg-white p-5 rounded-2xl mb-4 border"
      style={{
        borderColor: colors.border.light,
        opacity: claiming ? 0.45 : 1,
        alignItems: "center",
      }}
    >
      {/* Left: Image Grid */}
      <View className="mr-5">{renderImageGrid()}</View>

      {/* Middle: Order Info */}
      <View className="flex-1">
        <Text
          style={{ color: colors.text.DEFAULT }}
          className="font-inter-bold text-[20px] mb-1"
        >
          Order #{order.orderId || order.id.slice(0, 8)}
        </Text>
        <Text
          style={{ color: colors.text.secondary }}
          className="font-inter-medium text-[15px] mb-3"
          numberOfLines={1}
        >
          {medicineLabel}
        </Text>
        <TimeAgo
          date={order.date || ""}
          style={{ color: "#6A6A6A" }}
          className="font-inter-medium text-[14px]"
        />
      </View>

      {/* Right: Arrow — self-stretch keeps it centered to full card height */}
      <View style={{ alignSelf: "center", marginLeft: 8 }}>
        <ArrowForward width={18} height={18} fill={colors.text.muted} />
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(OrderCard);
