import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStore } from '@/src/store/useNetworkStore';
import { useTabBarStore } from '@/src/store/useTabBarStore';
import { requestQueue } from '@/src/utils/requestQueue';
import axiosInstance from '@/src/api/client';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const NetworkToast = () => {
    const { isConnected, isInternetReachable, setIsConnected } = useNetworkStore();
    const tabBarHeight = useTabBarStore(s => s.tabBarHeight);
    const [isLoading, setIsLoading] = useState(false);
    const [reconnected, setReconnected] = useState(false);
    const translateY = useRef(new Animated.Value(300)).current;
    const wasOfflineRef = useRef(false);

    // State for the stepped Wi-Fi animation (1-4 bars)
    const [signalStep, setSignalStep] = useState(1);

    const showToast = isConnected === false || isInternetReachable === false;
    const isLowNetwork = isConnected === true && isInternetReachable === false;

    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const slideIn = () => Animated.spring(translateY, {
        toValue: 0, useNativeDriver: true, friction: 12, tension: 50,
    }).start();

    const slideOut = (cb?: () => void) => Animated.timing(translateY, {
        toValue: 300, duration: 300, useNativeDriver: true,
    }).start(cb);

    useEffect(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);

        if (showToast) {
            wasOfflineRef.current = true;
            setReconnected(false);
            slideIn();
        } else if (wasOfflineRef.current) {
            // Just came back online — show reconnected toast for 3s
            wasOfflineRef.current = false;
            setReconnected(true);
            setIsLoading(false);
            slideIn();
            hideTimer.current = setTimeout(() => {
                slideOut(() => setReconnected(false));
            }, 3000);
        }

        return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
    }, [showToast]);

    // Handle the stepped signal animation when in Low Network state
    useEffect(() => {
        let interval: any = null;
        
        if (isLowNetwork) {
            interval = setInterval(() => {
                setSignalStep(prev => (prev >= 4 ? 1 : prev + 1));
            }, 400); // 400ms feels premium and calm
        } else {
            setSignalStep(1);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLowNetwork]);

    const handleRefresh = async () => {
        setIsLoading(true);

        // Add a slight delay to show the spinner (premium feel)
        await new Promise(resolve => setTimeout(resolve, 800));

        const state = await NetInfo.refresh();
        const connected = state.isConnected; // Preserve null if status is unknown
        const reachable = state.isInternetReachable;

        setIsConnected(connected, reachable);

        if (connected === true && reachable === true) {
            requestQueue.process(axiosInstance);
        } else {
            setIsLoading(false);
        }
    };

    const getMessage = () => {
        if (isConnected === false) return "Internet connection lost";
        if (isInternetReachable === false) return "Low network connection";
        return "";
    };

    return (
        <Animated.View
            pointerEvents={showToast || reconnected ? 'auto' : 'none'}
            className="absolute left-0 right-0 items-center z-[1000000]"
            style={[{ bottom: tabBarHeight, transform: [{ translateY }] }]}
        >
            <View
                className="flex-row items-center justify-between py-3 px-5 rounded-lg"
                style={{ width: width * 0.94, backgroundColor: reconnected ? '#0F7635' : '#333333' }}
            >
                {reconnected ? (
                    <View className="flex-row items-center flex-1">
                        <MaterialCommunityIcons name="wifi-check" size={20} color="#fff" />
                        <Text className="text-white text-base font-inter-Medium ml-3">
                            Back online
                        </Text>
                    </View>
                ) : isLoading ? (
                    <View className="flex-row items-center flex-1">
                        <ActivityIndicator size="small" color="#10B981" />
                        <Text className="text-white text-base font-inter-Medium ml-3">
                            Checking connection...
                        </Text>
                    </View>
                ) : (
                    <>
                        <View className="flex-row items-center flex-1">
                            <Text className="text-white text-base font-inter-Medium">
                                {getMessage()}
                            </Text>
                        </View>

                        {isLowNetwork ? (
                            <View className="ml-4">
                                <MaterialCommunityIcons
                                    name={`wifi-strength-${signalStep}` as any}
                                    size={22}
                                    color="#10B981"
                                />
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={handleRefresh}
                                disabled={isLoading}
                                className="ml-4 bg-white/10 py-1.5 px-4 rounded-md"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Text className="text-[#10B981] text-base font-inter-Bold uppercase tracking-wider">
                                    Refresh
                                </Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
        </Animated.View>
    );
};

export default NetworkToast;
