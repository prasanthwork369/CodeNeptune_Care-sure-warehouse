import { icons } from "@/src/constants/icons";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface LogoutConfirmModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isVisible,
  onCancel,
  onConfirm,
}) => {
  const LogoutIcon = icons.logout;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View
          className="bg-white w-full items-center"
          style={{
            borderRadius: 16,
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: 24,
          }}
        >
          <View
            style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: "#FFE4E4",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <LogoutIcon width={36} height={36} fill="#CA2B25" />
          </View>

          <Text
            className="font-inter-bold text-[#1A1C1E] text-center"
            style={{ fontSize: 16, marginBottom: 24 }}
          >
            Are you sure you want to logout?
          </Text>

          <View className="flex-row w-full" style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 13,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#DDDDDD",
                backgroundColor: "#FFFFFF",
                alignItems: "center",
              }}
            >
              <Text className="text-[15px] font-inter-semibold text-[#1A1C1E]">
                No
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 13,
                borderRadius: 999,
                backgroundColor: "#E53935",
                alignItems: "center",
              }}
            >
              <Text className="text-[15px] font-inter-semibold text-white">
                Yes, Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
