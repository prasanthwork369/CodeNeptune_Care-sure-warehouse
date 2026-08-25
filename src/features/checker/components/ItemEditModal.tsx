import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { colors } from "@/src/theme/colors";
import { icons } from "@/src/constants/icons";

const REASONS = [
  "Occur damage",
  "Mismatch batch number",
  "Split Batch Picking",
];

export interface ItemEditModalProps {
  isVisible: boolean;
  itemName?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({
  isVisible,
  itemName,
  onClose,
  onConfirm,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      setSelected(null);
      setDropdownOpen(false);
      opacity.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.quad),
      });
    } else {
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [isVisible, opacity]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: interpolate(opacity.value, [0, 1], [0.95, 1]) },
      { translateY: interpolate(opacity.value, [0, 1], [12, 0]) },
    ],
  }));

  const handleSelect = (reason: string) => {
    setSelected(reason);
    setDropdownOpen(false);
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            backdropStyle,
            { backgroundColor: "rgba(0,0,0,0.5)" },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Card */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <Animated.View
            style={[
              cardStyle,
              {
                width: "100%",
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 24,
              },
            ]}
          >
            {/* Title */}
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Inter_600SemiBold",
                color: colors.text.DEFAULT,
                marginBottom: 16,
              }}
            >
              {"What's the issue with this item?"}
            </Text>

            {/* Dropdown trigger */}
            <TouchableOpacity
              onPress={() => setDropdownOpen((prev) => !prev)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1.5,
                borderColor: dropdownOpen ? colors.brand.primary : "#E0E0E0",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor: "#fff",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  color: selected ? colors.text.DEFAULT : "#9E9E9E",
                }}
              >
                {selected || "Select the reason"}
              </Text>
              {dropdownOpen ? (
                <icons.arrow_up
                  width={14}
                  height={14}
                  fill={colors.brand.primary}
                />
              ) : (
                <icons.arrow_down width={14} height={14} fill="#9E9E9E" />
              )}
            </TouchableOpacity>

            {/* Dropdown options */}
            {dropdownOpen && (
              <View
                style={{
                  borderWidth: 1.5,
                  borderColor: "#E0E0E0",
                  borderRadius: 12,
                  marginTop: 4,
                  overflow: "hidden",
                  backgroundColor: "#fff",
                }}
              >
                {REASONS.map((reason, index) => (
                  <TouchableOpacity
                    key={reason}
                    onPress={() => handleSelect(reason)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      borderBottomWidth: index < REASONS.length - 1 ? 1 : 0,
                      borderBottomColor: "#F0F0F0",
                      backgroundColor:
                        selected === reason ? colors.surface.gray : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily:
                          selected === reason
                            ? "Inter_600SemiBold"
                            : "Inter_400Regular",
                        color: colors.text.DEFAULT,
                      }}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Actions */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 24,
                gap: 12,
              }}
            >
              <TouchableOpacity
                onPress={onClose}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: colors.surface.gray,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_600SemiBold",
                    color: colors.text.DEFAULT,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => selected && onConfirm(selected)}
                disabled={!selected}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: selected
                    ? colors.brand.primary
                    : colors.surface.gray,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_600SemiBold",
                    color: selected ? "#fff" : colors.text.secondary,
                  }}
                >
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

export default ItemEditModal;
