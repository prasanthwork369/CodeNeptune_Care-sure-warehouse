import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useNetworkStore } from "@/src/store/useNetworkStore";
import { useTabBarStore } from "@/src/store/useTabBarStore";
import { requestQueue } from "@/src/utils/requestQueue";
import axiosInstance from "@/src/api/client";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { exactScale } from "@/src/utils/exactScale";
import { AlertDialog } from "@/src/components/ui/AlertDialog";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

const NetworkToast = () => {
  const isConnected = useNetworkStore((s) => s.isConnected);
  const isInternetReachable = useNetworkStore((s) => s.isInternetReachable);
  const setIsConnected = useNetworkStore((s) => s.setIsConnected);
  const offlineAlertVisible = useNetworkStore((s) => s.offlineAlertVisible);
  const hideOfflineAlert = useNetworkStore((s) => s.hideOfflineAlert);
  const tabBarHeight = useTabBarStore((s) => s.tabBarHeight);

  const [isLoading, setIsLoading] = useState(false);
  const translateY = useRef(new Animated.Value(300)).current;
  const [signalStep, setSignalStep] = useState(1);

  const showToast = isConnected === false || isInternetReachable === false;
  const [showToastDelayed, setShowToastDelayed] = useState(false);
  const isLowNetwork = isConnected === true && isInternetReachable === false;
  const isRestored = !showToast && showToastDelayed;

  useEffect(() => {
    if (
      isConnected === true &&
      isInternetReachable === true &&
      offlineAlertVisible
    ) {
      hideOfflineAlert();
    }
  }, [isConnected, isInternetReachable, offlineAlertVisible]);

  useEffect(() => {
    if (showToast) {
      setShowToastDelayed(true);
    } else {
      const t = setTimeout(() => setShowToastDelayed(false), 1800);
      return () => clearTimeout(t);
    }
  }, [showToast]);

  useEffect(() => {
    if (showToastDelayed) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: !isWeb,
        friction: 12,
        tension: 50,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 300,
        duration: 300,
        useNativeDriver: !isWeb,
      }).start(() => {
        setIsLoading(false);
      });
    }
  }, [showToastDelayed]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isLowNetwork) {
      interval = setInterval(() => {
        setSignalStep((prev) => (prev >= 4 ? 1 : prev + 1));
      }, 400);
    } else {
      setSignalStep(isRestored ? 4 : 1);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLowNetwork, isRestored]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const state = await NetInfo.refresh();
    const connected = state.isConnected;
    const reachable = state.isInternetReachable;
    setIsConnected(connected, reachable);
    if (connected === true && reachable === true) {
      requestQueue.process(axiosInstance);
    } else {
      setIsLoading(false);
    }
  };

  const getMessage = () => {
    if (isRestored) return "Connection restored";
    if (isConnected === false) return "Internet connection lost";
    if (isInternetReachable === false) return "Low network connection";
    return "";
  };

  return (
    <>
      <AlertDialog
        visible={offlineAlertVisible}
        onClose={hideOfflineAlert}
        icon="no_internet"
        title={
          "No Internet Connection\nPlease check your connection\nand try again."
        }
        buttons={[
          { label: "Got it", onPress: hideOfflineAlert, variant: "outline" },
        ]}
      />

      <Animated.View
        pointerEvents={showToastDelayed ? "auto" : "none"}
        className="absolute left-0 right-0 items-center z-[1000000]"
        style={[
          {
            bottom: Math.max(tabBarHeight + 16, 24),
            transform: [{ translateY }],
          },
        ]}
      >
        <View
          className="flex-row items-center justify-between py-3.5 px-5 rounded-full shadow-2xl elevation-8"
          style={{
            width: Math.min(width * 0.95, 520),
            backgroundColor: isRestored ? "#0F7635" : "#222222",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          {isLoading ? (
            <View className="flex-row items-center flex-1 py-1">
              <ActivityIndicator size="small" color="#10B981" />
              <Text className="text-white text-[15px] font-inter-medium ml-3">
                Checking connection...
              </Text>
            </View>
          ) : (
            <>
              <View className="flex-row items-center flex-1 pr-2">
                <Text className="text-white text-[15px] font-inter-semibold">
                  {getMessage()}
                </Text>
              </View>

              {isLowNetwork || isRestored ? (
                <View className="ml-3 flex-row items-center py-1">
                  {isRestored ? (
                    <MaterialCommunityIcons
                      name="wifi-check"
                      size={24}
                      color="#FFFFFF"
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={`wifi-strength-${signalStep}` as any}
                      size={24}
                      color="#10B981"
                    />
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleRefresh}
                  disabled={isLoading}
                  activeOpacity={0.7}
                  className="ml-3 bg-[#10B981] py-2.5 px-5 rounded-full"
                  hitSlop={{ top: 12, bottom: 12, left: 14, right: 14 }}
                >
                  <Text className="text-white text-[14px] font-inter-bold uppercase tracking-wider">
                    Refresh
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Animated.View>
    </>
  );
};

export default NetworkToast;
