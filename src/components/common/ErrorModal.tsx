import React, { useEffect } from "react";
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
import { Ionicons } from "@expo/vector-icons";

interface ErrorModalProps {
  visible: boolean;
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  onDismiss: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  visible,
  title = "Something went wrong",
  message,
  retryLabel = "Try Again",
  onRetry,
  onDismiss,
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
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            backdropStyle,
            { backgroundColor: "rgba(0,0,0,0.45)", zIndex: 0 },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        </Animated.View>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
            zIndex: 1,
          }}
        >
          <Animated.View
            style={[
              cardStyle,
              {
                width: "100%",
                backgroundColor: "#fff",
                borderRadius: 24,
                paddingHorizontal: 24,
                paddingTop: 36,
                paddingBottom: 28,
              },
            ]}
          >
            {/* Icon */}
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: "#FDECEA",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={44}
                  color="#D9534F"
                />
              </View>
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Inter_700Bold",
                color: "#1A1A1A",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              {title}
            </Text>

            {/* Message */}
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_500Medium",
                color: "#6A6A6A",
                textAlign: "center",
                lineHeight: 22,
                marginBottom: 28,
                paddingHorizontal: 8,
              }}
            >
              {message}
            </Text>

            {/* Try Again */}
            {onRetry && (
              <TouchableOpacity
                onPress={onRetry}
                activeOpacity={0.85}
                style={{
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "#D9534F",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Inter_700Bold",
                    color: "#fff",
                  }}
                >
                  {retryLabel}
                </Text>
              </TouchableOpacity>
            )}

            {/* Dismiss */}
            <TouchableOpacity
              onPress={onDismiss}
              activeOpacity={0.7}
              style={{ alignItems: "center", paddingVertical: 10 }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "Inter_500Medium",
                  color: "#6A6A6A",
                }}
              >
                Dismiss
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

export default ErrorModal;
