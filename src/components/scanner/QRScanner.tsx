import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  AppState,
  AppStateStatus,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
  KeyboardEvent,
  KeyboardAvoidingView,
} from "react-native";
import AppLoader from "@/src/components/common/AppLoader";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCAN_SIZE = 300;

const QRScanner = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { context } = useLocalSearchParams<{ context?: string }>();
  const isDispatcher = context === "dispatcher";

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [manualId, setManualId] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const translateY = useSharedValue(0);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (permission?.granted) {
      translateY.value = 0;
      translateY.value = withRepeat(
        withTiming(SCAN_SIZE, { duration: 2500, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(translateY);
    }
    return () => cancelAnimation(translateY);
  }, [permission?.granted]);

  const animatedLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      setScanned(false);
      return () => {
        // Unmount CameraView on blur to prevent topCameraReady Fabric error
        setIsFocused(false);
      };
    }, []),
  );

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      await requestPermission();
    } catch (e) {
      if (__DEV__) console.error("Permission error:", e);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenSettings = () => {
    Alert.alert(
      "Camera Access Required",
      "Enable camera access in Settings to scan QR codes.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Settings",
          onPress: () =>
            Platform.OS === "ios"
              ? Linking.openURL("app-settings:")
              : Linking.openSettings(),
        },
      ],
    );
  };

  const navigate = useCallback(
    (cleanId: string) => {
      setIsNavigating(true);
      if (isDispatcher) {
        router.replace({
          pathname: "/dispatching/order-status",
          params: { orderId: cleanId },
        } as any);
      } else {
        router.replace(`/packing/order-summary/${cleanId}` as any);
      }
    },
    [isDispatcher],
  );

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;
      setScanned(true);
      cancelAnimation(translateY);
      const cleanId = data.replace("#", "").trim();

      if (!cleanId) {
        setScanned(false);
        return;
      }

      navigate(cleanId);
    },
    [scanned, navigate],
  );

  const handleManualSubmit = () => {
    const cleanId = manualId.replace("#", "").trim();
    if (cleanId) navigate(cleanId);
  };

  const Header = () => (
    <View
      style={{ paddingTop: insets.top + 10 }}
      className="px-6 pb-4 flex-row items-center"
    >
      <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1 ml-2">
        <Ionicons name="arrow-back" size={26} color="white" />
      </TouchableOpacity>
      <Text className="text-white text-[22px]  font-inter-semibold">scan</Text>
    </View>
  );

  const manualInputEl = (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: keyboardHeight > 0 ? keyboardHeight + 8 : 12,
        paddingHorizontal: 32,
      }}
    >
      <View className="bg-[#4D4D4D] h-[72px] rounded-[14px] flex-row items-center px-5">
        <TextInput
          className="flex-1 text-white text-[17px]"
          placeholder="Enter Order ID manually"
          placeholderTextColor="#8E8E8E"
          value={manualId}
          onChangeText={setManualId}
          returnKeyType="go"
          onSubmitEditing={handleManualSubmit}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={handleManualSubmit} activeOpacity={0.7}>
          <Feather name="arrow-right" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!permission) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#1A1A1A" }}
      >
        <StatusBar style="light" translucent />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <Header />
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#fff" />
          </View>
          {manualInputEl}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (!permission.granted && permission.canAskAgain) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#1A1A1A" }}
      >
        <StatusBar style="light" translucent />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <Header />
          <View className="flex-1 items-center justify-center px-10 gap-4">
            <View className="w-[90px] h-[90px] rounded-full bg-white/10 items-center justify-center mb-2">
              <MaterialIcons name="camera-alt" size={40} color="white" />
            </View>
            <Text className="text-white text-[20px] font-semibold text-center">
              Camera Access Needed
            </Text>
            <Text className="text-white/55 text-[16px] text-center leading-[22px] mb-2">
              Allow camera access to scan QR codes quickly.
            </Text>
            <TouchableOpacity
              className="bg-white px-8 py-3.5 rounded-full flex-row items-center mt-2 w-full justify-center"
              onPress={handleRequestPermission}
              disabled={isRequesting}
              activeOpacity={0.8}
            >
              {isRequesting ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text className="text-black text-[15px] font-semibold">
                  Allow Camera Access
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} className="py-3">
              <Text className="text-white/45 text-[14px]">Go Back</Text>
            </TouchableOpacity>
          </View>
          {manualInputEl}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (!permission.granted && !permission.canAskAgain) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#1A1A1A" }}
      >
        <StatusBar style="light" translucent />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <Header />
          <View className="flex-1 items-center justify-center px-10 gap-4">
            <View className="w-[90px] h-[90px] rounded-full bg-[rgba(255,80,80,0.15)] items-center justify-center mb-2">
              <MaterialIcons name="no-photography" size={40} color="#FF6B6B" />
            </View>
            <Text className="text-white text-[20px] font-semibold text-center">
              Camera Access Blocked
            </Text>
            <Text className="text-white/55 text-[14px] text-center leading-[22px] mb-2">
              Camera was denied. Enable it in your device Settings.
            </Text>
            <TouchableOpacity
              className="bg-white px-8 py-3.5 rounded-full flex-row items-center mt-2 w-full justify-center"
              onPress={handleOpenSettings}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="settings"
                size={18}
                color="#000"
                style={{ marginRight: 8 }}
              />
              <Text className="text-black text-[15px] font-semibold">
                Open Settings
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} className="py-3">
              <Text className="text-white/45 text-[14px]">Go Back</Text>
            </TouchableOpacity>
          </View>
          {manualInputEl}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: "#1A1A1A" }}
    >
      <StatusBar style="light" translucent />
      <View className="flex-1">
        <Header />

        <View className="flex-1 mx-4 mb-4 rounded-[40px] overflow-hidden bg-black">
          {isFocused && (
            <CameraView
              style={StyleSheet.absoluteFill}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />
          )}

          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View className="flex-1 bg-[rgba(0,0,0,0.55)]" />
            <View style={{ height: SCAN_SIZE }} className="flex-row">
              <View className="flex-1 bg-[rgba(0,0,0,0.55)]" />
              <View style={{ width: SCAN_SIZE, height: SCAN_SIZE }} />
              <View className="flex-1 bg-[rgba(0,0,0,0.55)]" />
            </View>
            <View className="flex-1 bg-[rgba(0,0,0,0.55)]" />
          </View>

          <View className="absolute inset-0 items-center justify-center">
            <View className="bg-[#121212] px-5 py-2.5 rounded-[100px] mb-4">
              <Text className="text-[#BEBEBE] text-[14px]">
                Align QR code within the frame
              </Text>
            </View>

            <View
              style={{ width: SCAN_SIZE + 40, height: SCAN_SIZE + 40 }}
              className="items-center justify-center"
            >
              <View className="absolute top-0 left-0 w-[50px] h-[50px] border-t-[5px] border-l-[5px] border-white rounded-tl-[30px]" />
              <View className="absolute top-0 right-0 w-[50px] h-[50px] border-t-[5px] border-r-[5px] border-white rounded-tr-[30px]" />
              <View className="absolute bottom-0 left-0 w-[50px] h-[50px] border-b-[5px] border-l-[5px] border-white rounded-bl-[30px]" />
              <View className="absolute bottom-0 right-0 w-[50px] h-[50px] border-b-[5px] border-r-[5px] border-white rounded-br-[30px]" />

              <View
                style={{ width: SCAN_SIZE, height: SCAN_SIZE }}
                className="overflow-hidden"
              >
                <Animated.View
                  style={[
                    {
                      width: SCAN_SIZE,
                      height: 2,
                      backgroundColor: "rgba(255,255,255,0.85)",
                      borderRadius: 1,
                    },
                    animatedLineStyle,
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-10 w-[58px] h-[58px] rounded-[29px] items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {manualInputEl}
      </View>

      <AppLoader
        visible={isNavigating}
        title="Loading order..."
        subtitle="Please wait a moment"
      />
    </SafeAreaView>
  );
};

export default QRScanner;
