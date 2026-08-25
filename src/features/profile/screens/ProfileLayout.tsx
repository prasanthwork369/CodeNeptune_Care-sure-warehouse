import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService } from "@/src/features/auth/services/auth.service";
import { icons } from "@/src/constants/icons";
import { colors } from "@/src/constants/colors";
import * as Haptics from "expo-haptics";
import UploadBottomSheet from "../components/UploadBottomSheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useImageUpload } from "../hooks/useImageUpload";
import EditProfileModal from "../components/EditProfileModal";
import { useUserQuery, useUpdateUserMutation } from "../hooks/useUser";
import { ProfileSkeleton } from "../components/ProfileSkeleton";
import { LogoutConfirmModal } from "../components/LogoutConfirmModal";
import AppLoader from "@/src/components/common/AppLoader";
import BackButton from "@/src/components/common/BackButton";

export const ProfileLayout = () => {
  const {
    data: user,
    isLoading: profileLoading,
    isFetching: refreshing,
    refetch,
  } = useUserQuery();

  const { mutateAsync: updateUser } = useUpdateUserMutation();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  // Using the modular image upload hook
  const {
    isSheetVisible,
    setIsSheetVisible,
    isUploading,
    tempAvatar,
    handleImageUpload,
    onSelectCamera,
    onSelectLibrary,
  } = useImageUpload();

  // Strictly DB content - no local USER_DATA fallbacks
  const firstName = user?.profile?.firstName || "";
  const lastName = user?.profile?.lastName || "";
  const userName = (firstName + " " + lastName).trim() || "User";
  const userEmail = user?.email || "Not available";
  const userPhone = user?.profile?.phone || "Not provided";
  const empId = user?.id ? `ID-${user.id.slice(0, 8).toUpperCase()}` : "N/A";

  // Use real createdAt date from user data if available
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "April 15, 2021";

  const onRefresh = async () => {
    try {
      await refetch();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      if (__DEV__) console.error("Failed to refresh profile:", e);
    }
  };

  const handleUpdateProfile = async (data: any) => {
    if (!user?.id) return;
    try {
      await updateUser({ id: user.id, data });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      if (__DEV__) console.error("Update failed:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  };

  const handleLogout = () => {
    setIsLogoutModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsLogoutModalVisible(false); // Close confirm modal so AppLoader shows cleanly
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } catch (error) {
      if (__DEV__) console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const initial = (firstName?.[0] || lastName?.[0] || "U").toUpperCase();
  const EditIcon = icons.edit;
  const DraftIcon = icons.drafts;
  const CalendarIcon = icons.calendar_month;
  const LogoutIcon = icons.logout;

  if (profileLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgMain }}>
      {/* Realtime Upload Bottom Sheet */}
      <UploadBottomSheet
        visible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
        onSelectCamera={onSelectCamera}
        onSelectLibrary={onSelectLibrary}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleUpdateProfile}
        profile={{
          firstName: user?.profile?.firstName || "",
          lastName: user?.profile?.lastName || "",
          phone: user?.phone || user?.profile?.phone || "",
          avatarUrl: user?.profile?.avatarUrl,
        }}
      />

      <LogoutConfirmModal
        isVisible={isLogoutModalVisible}
        onCancel={() => setIsLogoutModalVisible(false)}
        onConfirm={handleConfirmLogout}
      />

      <AppLoader
        visible={isLoggingOut}
        title="Logging out..."
        subtitle="Please wait a moment"
      />

      {/* Header */}
      <View
        className="px-5 pb-4 flex-row items-center bg-white border-b border-[#F0F0F0]"
        style={{ paddingTop: 8 }}
      >
        <BackButton />
        <Text
          className="text-[19px] font-inter-bold ml-1"
          style={{ color: colors.textMain }}
        >
          Profile
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.textMuted]} // Android
            tintColor={colors.textMuted} // iOS
          />
        }
      >
        {/* Profile Header section */}
        <View className="items-center mt-6 mb-8">
          <View className="relative">
            <View className="w-[124px] h-[124px] rounded-full overflow-hidden border-2 border-white bg-white">
              {tempAvatar || user?.profile?.avatarUrl ? (
                <View className="flex-1">
                  <Image
                    source={{
                      uri: tempAvatar || user?.profile?.avatarUrl || "",
                    }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                  {isUploading && (
                    <View className="absolute inset-0 bg-black/30 items-center justify-center">
                      <ActivityIndicator color="white" />
                    </View>
                  )}
                </View>
              ) : (
                <View
                  style={{ backgroundColor: colors.primary }}
                  className="w-full h-full items-center justify-center"
                >
                  <Text className="text-[48px] font-inter-bold text-white">
                    {initial}
                  </Text>
                </View>
              )}
            </View>

            {/* Camera Upload Button */}
            <TouchableOpacity
              onPress={handleImageUpload}
              activeOpacity={0.8}
              className="absolute bottom-0 right-1 w-10 h-10 bg-white rounded-full items-center justify-center border border-[#F0F0F0]"
            >
              <MaterialCommunityIcons
                name="camera"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          <Text
            className="text-[22px] font-inter-extrabold mt-4"
            style={{ color: colors.textMain }}
          >
            {userName || "Test 1"}
          </Text>
          <Text
            className="text-[14px] font-inter mt-1"
            style={{ color: colors.textSecondary }}
          >
            {empId}
          </Text>
          <TouchableOpacity
            onPress={() => setIsEditModalVisible(true)}
            className="w-18 h-8 py-1 px-2 mt-2 rounded-full bg-[#F0F0F0] flex-row items-center justify-center gap-2 p-0"
            activeOpacity={0.7}
          >
            <Text className="text-[#222222] ml-2 text-[14px] font-inter-semibold">
              Edit
            </Text>
            <EditIcon width={14} height={12} fill={"#D9D9D9"} />
          </TouchableOpacity>
        </View>

        {/* Account Details Label */}
        <View className="mb-3">
          <Text
            className="text-[16px] font-inter-medium"
            style={{ color: colors.textSecondary }}
          >
            Account Details
          </Text>
        </View>

        {/* Account Details Card */}
        <View
          className="bg-white rounded-[24px] p-5 mb-8"
          style={{ borderColor: colors.borderLight }}
        >
          {/* Email Row */}
          <View className="flex-row items-center mb-6">
            <View className="w-12 h-12 rounded-[16px] items-center justify-center bg-[#DCF5E8]">
              <DraftIcon width={24} height={24} fill={colors.primary} />
            </View>
            <View className="ml-4 flex-1">
              <Text
                className="text-[12px] font-inter-medium"
                style={{ color: colors.textSecondary }}
              >
                Email Address
              </Text>
              <Text
                className="text-[15px] font-inter-medium mt-0.5"
                style={{ color: colors.textMain }}
              >
                {userEmail}
              </Text>
            </View>
          </View>

          {/* Join Date Row */}
          <View className="flex-row items-center mb-6">
            <View className="w-12 h-12 rounded-[16px] items-center justify-center  bg-[#DCF5E8]">
              <CalendarIcon width={24} height={24} fill={colors.primary} />
            </View>
            <View className="ml-4 flex-1">
              <Text
                className="text-[12px] font-inter-medium"
                style={{ color: colors.textSecondary }}
              >
                Join Date
              </Text>
              <Text
                className="text-[15px] font-inter-medium mt-0.5"
                style={{ color: colors.textMain }}
              >
                {joinDate}
              </Text>
            </View>
          </View>

          {/* Phone Row */}
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-[16px] items-center justify-center  bg-[#DCF5E8]">
              <MaterialCommunityIcons
                name="phone"
                size={22}
                color={colors.primary}
              />
            </View>
            <View className="ml-4 flex-1">
              <Text
                className="text-[12px] font-inter-medium"
                style={{ color: colors.textSecondary }}
              >
                Phone Number
              </Text>
              <Text
                className="text-[15px] font-inter-medium mt-0.5"
                style={{ color: colors.textMain }}
              >
                {userPhone}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Action */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row ml-2 items-center py-2 active:opacity-70"
        >
          <LogoutIcon width={18} height={18} fill="#CF1A1A" />
          <Text
            className="text-[16px] font-inter-semibold ml-3"
            style={{ color: "#CF1A1A" }}
          >
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileLayout;
