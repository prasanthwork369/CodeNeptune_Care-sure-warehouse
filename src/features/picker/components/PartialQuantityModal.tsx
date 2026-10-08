import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { OrderItem } from "@/src/features/picker/types/order.types";
import CustomKeypad from '@/src/components/common/CustomKeypad';
import { colors } from "@/src/theme/colors";

interface PartialQuantityModalProps {
  isVisible: boolean;
  item: OrderItem | null;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}

const PartialQuantityModal: React.FC<PartialQuantityModalProps> = ({
  isVisible,
  item,
  onClose,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState("");

  // Animation shared values
  const opacity = useSharedValue(0);
  const caretOpacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      setQuantity("");
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });

      // Caret blink animation
      caretOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 500 }),
        ),
        -1,
        true,
      );
    } else {
      opacity.value = withTiming(0, {
        duration: 250,
        easing: Easing.in(Easing.quad),
      });
      caretOpacity.value = 0;
    }
  }, [isVisible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: interpolate(opacity.value, [0, 1], [0.9, 1]) },
      { translateY: interpolate(opacity.value, [0, 1], [20, 0]) },
    ],
  }));

  const keypadStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(opacity.value, [0, 1], [300, 0]) }],
  }));

  const caretStyle = useAnimatedStyle(() => ({
    opacity: caretOpacity.value,
  }));

  const handleConfirm = () => {
    const val = parseInt(quantity, 10);
    if (!isNaN(val) && val >= 0) {
      onConfirm(val);
    }
  };

  const hasValue = quantity.length > 0;
  const isOverQty = !!item && parseInt(quantity, 10) > item.requiredQty;
  const isInvalid = !hasValue || isNaN(parseInt(quantity, 10)) || isOverQty;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View className="flex-1">
        {/* Backdrop */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            backdropStyle,
            { backgroundColor: "rgba(0,0,0,0.6)" },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Interaction Area with Flexbox centering above keypad */}
        <View className="flex-1 ">
          {/* Top Area - Modal centered here */}
          <View className="flex-1 mt-20 justify-center items-center px-6">
            <Animated.View
              style={[cardStyle]}
              className="bg-white w-full rounded-[32px] p-6 shadow-2xl"
            >
              {/* Header */}
              <View className="items-center mb-6">
                <Text
                  style={{ color: colors.text.deep }}
                  className="text-[28px] font-bold text-center mb-1"
                >
                  {item?.name}
                </Text>
                <Text
                  style={{ color: colors.text.secondary }}
                  className="text-[18px] font-medium text-center"
                >
                  {item?.requiredQty} Units Required
                </Text>
              </View>

              {/* Prompt */}
              <Text
                style={{ color: colors.text.deep }}
                className="text-[16px] font-normal text-center mb-6"
              >
                Enter available quantity
              </Text>

              {/* Large Input Display (Blue Bordered Box) */}
              <View
                style={{
                  backgroundColor: isOverQty ? "#FEF2F2" : colors.surface.gray,
                  borderColor: isOverQty ? "#EF4444" : colors.text.blue,
                }}
                className="w-full h-36 rounded-2xl border-[1.5px] items-center justify-center mb-2"
              >
                <View className="flex-row items-center">
                  <Text
                    style={{
                      color: !hasValue
                        ? "#C7C7CC"
                        : isOverQty
                          ? "#DC2626"
                          : colors.text.deep,
                    }}
                    className={`text-7xl ${hasValue ? "font-bold" : "font-normal"}`}
                  >
                    {hasValue ? quantity : "0"}
                  </Text>
                  <Animated.View
                    style={[
                      caretStyle,
                      {
                        height: 50,
                        width: 3,
                        backgroundColor: colors.text.blue,
                        marginLeft: 4,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Error Context */}
              <View className="h-6 mb-8 items-center">
                {isOverQty && (
                  <Text className="text-red-500 text-[14px] font-bold">
                    Quantity cannot exceed {item?.requiredQty} units
                  </Text>
                )}
              </View>

              {/* Footer Actions */}
              <View className="flex-row items-center justify-end">
                <TouchableOpacity onPress={onClose} className="mr-8">
                  <Text
                    style={{ color: colors.text.deep }}
                    className="text-[18px] font-bold"
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={isInvalid}
                  onPress={handleConfirm}
                  style={{
                    backgroundColor: isInvalid
                      ? colors.surface.gray
                      : colors.brand.primary,
                    elevation: isInvalid ? 0 : 4,
                  }}
                  className="px-10 py-4 rounded-full"
                >
                  <Text
                    className={`text-[18px] font-bold ${isInvalid ? "text-black/20" : "text-white"}`}
                  >
                    Confirm
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>

          {/* Bottom Area - Keypad pinned here */}
          <Animated.View style={[keypadStyle]} className="bg-[#D1D3D9]">
            <CustomKeypad
              onPress={(digit: string) => {
                if (quantity.length < 3) {
                  setQuantity((prev) => {
                    if (prev === "0") return digit === "0" ? "0" : digit;
                    return prev + digit;
                  });
                }
              }}
              onDelete={() => {
                setQuantity((prev) => prev.slice(0, -1));
              }}
            />
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

export default PartialQuantityModal;
