import React, { useRef } from "react";
import { Modal, Text, View, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { moderateScale } from "@/src/utils/exactScale";

type IconVariant =
  | "package"
  | "check"
  | "check-green"
  | "delete"
  | "pdf"
  | "no_internet";
type ButtonVariant = "green" | "red" | "outline";

export interface AlertButton {
  label: string;
  onPress: () => void;
  variant: ButtonVariant;
}

export interface AlertDialogProps {
  visible: boolean;
  onClose: () => void;
  icon: IconVariant;
  title: string;
  buttons: AlertButton[];
}

function AlertIcon({ variant }: { variant: IconVariant }) {
  if (variant === "no_internet") {
    return (
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: "#F4EAD3",
          borderWidth: 1.5,
          borderColor: "#FFEAC3",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
        }}
      >
        <MaterialCommunityIcons name="wifi-off" size={32} color="#D97706" />
      </View>
    );
  }

  return (
    <View
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#FEFCE8",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
      }}
    >
      <MaterialCommunityIcons name="alert-circle" size={32} color="#D97706" />
    </View>
  );
}

export function AlertDialog({
  visible,
  onClose,
  icon,
  title,
  buttons,
}: AlertDialogProps) {
  const isRow = buttons.length > 1;
  const isSingle = buttons.length === 1;

  const hasOpened = useRef(false);
  if (visible) hasOpened.current = true;
  if (!visible && !hasOpened.current) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            width: "100%",
            maxWidth: 360,
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 24,
            alignItems: "center",
          }}
        >
          <AlertIcon variant={icon} />

          <Text
            style={{
              fontSize: moderateScale(16),
              fontWeight: "700",
              color: "#1A1C1E",
              textAlign: "center",
              marginBottom: 24,
              lineHeight: moderateScale(22),
            }}
          >
            {title}
          </Text>

          <View
            style={{
              flexDirection: isRow ? "row" : "column",
              gap: 10,
              width: "100%",
              alignItems: isSingle ? "center" : undefined,
            }}
          >
            {buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                onPress={btn.onPress}
                activeOpacity={0.85}
                style={[
                  {
                    paddingVertical: 13,
                    paddingHorizontal: isSingle ? 48 : undefined,
                    flex: isSingle ? undefined : 1,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    width: isSingle ? "100%" : undefined,
                  },
                  btn.variant === "green" && { backgroundColor: "#0F7635" },
                  btn.variant === "red" && { backgroundColor: "#EF4444" },
                  btn.variant === "outline" && {
                    backgroundColor: "#fff",
                    borderWidth: 1.5,
                    borderColor: "#D1D5DB",
                  },
                ]}
              >
                <Text
                  style={[
                    { fontSize: moderateScale(14), fontWeight: "600" },
                    (btn.variant === "green" || btn.variant === "red") && {
                      color: "#fff",
                    },
                    btn.variant === "outline" && { color: "#374151" },
                  ]}
                >
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default AlertDialog;
