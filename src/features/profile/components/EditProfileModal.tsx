import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/src/theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    firstName: string;
    lastName: string;
    phone: string;
  }) => Promise<void>;
  profile: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string | null;
  };
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onSave,
  profile,
}) => {
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setFirstName(profile?.firstName || "");
      setLastName(profile?.lastName || "");
      setPhone(profile?.phone || "");
    }
  }, [visible, profile?.firstName, profile?.lastName, profile?.phone]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {
        firstName,
        lastName,
        phone,
        avatarUrl: profile?.avatarUrl,
      };
      await onSave(updateData as any);
      onClose();
    } catch (error) {
      if (__DEV__) console.error("Save failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="absolute inset-0" onPress={onClose}>
          <BlurView intensity={20} tint="dark" className="flex-1" />
        </Pressable>

        <View
          className="bg-white rounded-t-[32px] max-h-[85%] pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          {/* Handle Bar */}
          <View className="w-10 h-[5px] bg-[#E5E5E5] rounded-full self-center mb-2" />

          {/* Header: App Theme Style */}
          <View className="h-[60px] flex-row items-center justify-between px-5 bg-white border-b border-[#F0F0F0]">
            <Text className="text-[18px] font-bold text-[#222222]">
              Edit Profile
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className=" items-center justify-center h-10 w-10 rounded-full bg-[#F0F0F0]"
              activeOpacity={0.7}
            >
              <Feather name="x" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-grow-0"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View className="mt-6 gap-5">
              <View className="gap-2">
                <Text
                  className="text-[14px] font-semibold ml-1 uppercase tracking-wider"
                  style={{ color: colors.text.secondary }}
                >
                  First Name
                </Text>
                <View className="flex-row items-center bg-[#F9F9F9] rounded-[16px] border border-[#EEEEEE] px-3 h-14">
                  <View
                    className="w-9 h-9 rounded-[10px] items-center justify-center mr-3"
                    style={{ backgroundColor: "#E8F4EC" }}
                  >
                    <Feather
                      name="user"
                      size={18}
                      color={colors.brand.primary}
                    />
                  </View>
                  <TextInput
                    className="flex-1 text-[16px] font-medium text-[#222222]"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter first name"
                    placeholderTextColor="#969696"
                  />
                </View>
              </View>

              <View className="gap-2">
                <Text
                  className="text-[14px] font-semibold ml-1 uppercase tracking-wider"
                  style={{ color: colors.text.secondary }}
                >
                  Last Name
                </Text>
                <View className="flex-row items-center bg-[#F9F9F9] rounded-[16px] border border-[#EEEEEE] px-3 h-14">
                  <View
                    className="w-9 h-9 rounded-[10px] items-center justify-center mr-3"
                    style={{ backgroundColor: "#E8F4EC" }}
                  >
                    <Feather
                      name="user"
                      size={18}
                      color={colors.brand.primary}
                    />
                  </View>
                  <TextInput
                    className="flex-1 text-[16px] font-medium text-[#222222]"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Enter last name"
                    placeholderTextColor="#969696"
                  />
                </View>
              </View>

              <View className="gap-2">
                <Text
                  className="text-[14px] font-semibold ml-1 uppercase tracking-wider"
                  style={{ color: colors.text.secondary }}
                >
                  Phone Number
                </Text>
                <View className="flex-row items-center bg-[#F9F9F9] rounded-[16px] border border-[#EEEEEE] px-3 h-14">
                  <View
                    className="w-9 h-9 rounded-[10px] items-center justify-center mr-3"
                    style={{ backgroundColor: "#E8F4EC" }}
                  >
                    <MaterialCommunityIcons
                      name="phone"
                      size={18}
                      color={colors.brand.primary}
                    />
                  </View>
                  <TextInput
                    className="flex-1 text-[16px] font-medium text-[#222222]"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter phone number"
                    placeholderTextColor="#969696"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                className="mt-2 h-14 rounded-[16px] items-center justify-center shadow-lg shadow-green-900/20"
                style={{
                  backgroundColor: colors.brand.primary,
                  opacity: loading ? 0.7 : 1,
                }}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-[16px] font-bold">
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default EditProfileModal;
