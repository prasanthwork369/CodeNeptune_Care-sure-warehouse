import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/src/theme/colors";

interface QRCodeModalProps {
  visible: boolean;
  orderId: string;
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  visible,
  orderId,
  onClose,
}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: visible ? 220 : 180,
      easing: Easing.out(Easing.quad),
    });
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: interpolate(opacity.value, [0, 1], [0.95, 1]) },
      { translateY: interpolate(opacity.value, [0, 1], [12, 0]) },
    ],
  }));

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            backdropStyle,
            { backgroundColor: "rgba(0,0,0,0.5)", zIndex: 0 },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 28,
            zIndex: 1,
          }}
        >
          <Animated.View
            style={[
              cardStyle,
              {
                width: "100%",
                backgroundColor: "#fff",
                borderRadius: 28,
                paddingHorizontal: 28,
                paddingTop: 32,
                paddingBottom: 28,
              },
            ]}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: "Inter_700Bold",
                    color: "#1A1A1A",
                  }}
                >
                  Order QR Code
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Inter_400Regular",
                    color: "#6A6A6A",
                    marginTop: 2,
                  }}
                >
                  Scan to identify this order
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#F2F2F2",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={18} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            {/* QR Code */}
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <View
                style={{
                  padding: 20,
                  backgroundColor: "#fff",
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "#F0F0F0",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <QRCode
                  value={orderId}
                  size={240}
                  color="#1A1A1A"
                  backgroundColor="#ffffff"
                  quietZone={6}
                />
              </View>
            </View>

            {/* Order ID label */}
            <View
              style={{
                backgroundColor: colors.brand.primarySoft,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 16,
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "Inter_500Medium",
                  color: colors.brand.primary,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                Order ID
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "Inter_700Bold",
                  color: "#1A1A1A",
                  letterSpacing: 0.5,
                }}
              >
                {orderId}
              </Text>
            </View>

            {/* Close button */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              style={{
                height: 52,
                borderRadius: 16,
                backgroundColor: colors.brand.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "Inter_700Bold",
                  color: "#fff",
                }}
              >
                Done
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

export default QRCodeModal;
