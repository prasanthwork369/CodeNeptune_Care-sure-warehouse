import React, { useEffect, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming, 
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Notification, useNotificationStore } from '@/src/store/useNotificationStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { useRouter, useSegments } from 'expo-router';
import { useOrderStore } from '@/src/store/useOrderStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface Props {
    notification: Notification;
    index: number;
}

/**
 * Priority-based configuration for durations and colors
 */
const PRIORITY_CONFIG = {
    info: { duration: 4000, color: colors.brand.primary, icon: 'information' },
    success: { duration: 4000, color: '#117B3E', icon: 'check-circle' },
    warning: { duration: 6000, color: '#FFA500', icon: 'alert' },
    error: { duration: 8000, color: '#FF4D4D', icon: 'alert-circle' },
    critical: { duration: 12000, color: '#9B1C1C', icon: 'alert-octagon' },
};

const NotificationItem: React.FC<Props> = memo(({ notification, index }) => {
    const router = useRouter();
    const segments = useSegments();
    const removeNotification = useNotificationStore((state) => state.removeNotification);
    const setActiveTab = useOrderStore((state) => state.setActiveTab);
    const activeTab = useOrderStore((state) => state.activeTab);
    
    const config = PRIORITY_CONFIG[notification.type] || PRIORITY_CONFIG.info;

    // Animation Values
    const translateY = useSharedValue(-100);
    const scale = useSharedValue(0.8);
    const opacity = useSharedValue(0);
    const translateX = useSharedValue(0);
    const contextX = useSharedValue(0);
    const progress = useSharedValue(1);

    const onDismiss = useCallback(() => {
        removeNotification(notification.id);
    }, [notification.id, removeNotification]);

    const handlePress = useCallback(() => {
        // Deep Linking Logic with Redundancy Check
        const isAlreadyOnPicker = (segments as string[]).includes('picker');
        
        if (notification.orderId) {
            if (activeTab !== 'new') {
                setActiveTab('new');
            }
            
            // Only push if not already on the picker view to avoid stacking
            if (!isAlreadyOnPicker) {
                router.push('/(tabs)/picker');
            }
        }
        
        onDismiss();
    }, [notification.orderId, segments, activeTab, setActiveTab, router, onDismiss]);

    useEffect(() => {
        // Entrance animation
        translateY.value = withTiming(0, { 
            duration: 500,
            easing: Easing.out(Easing.quad)
        });
        scale.value = withTiming(1, { 
            duration: 400,
            easing: Easing.out(Easing.quad)
        });
        opacity.value = withTiming(1, { 
            duration: 400,
            easing: Easing.out(Easing.quad)
        });

        // Progress bar animation (countdown based on priority)
        progress.value = withTiming(0, { 
            duration: config.duration,
            easing: Easing.linear 
        });

        // Auto-dismiss timer matched to priority
        const timer = setTimeout(() => {
            translateY.value = withTiming(-120, { 
                duration: 400,
                easing: Easing.inOut(Easing.quad)
            });
            opacity.value = withTiming(0, { 
                duration: 300 
            }, () => {
                runOnJS(onDismiss)();
            });
        }, config.duration);

        return () => clearTimeout(timer);
    }, [config.duration, onDismiss]);

    const panGesture = Gesture.Pan()
        .onStart(() => {
            contextX.value = translateX.value;
        })
        .onUpdate((event) => {
            translateX.value = contextX.value + event.translationX;
        })
        .onEnd((event) => {
            if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
                translateX.value = withTiming(
                    event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH, 
                    { duration: 300, easing: Easing.out(Easing.quad) }, 
                    () => runOnJS(onDismiss)()
                );
            } else {
                translateX.value = withSpring(0, { damping: 20 });
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { scale: scale.value }
        ],
        opacity: opacity.value,
        zIndex: 1000 - index,
        position: translateY.value === -120 ? 'absolute' : 'relative',
    }));

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View 
                style={[animatedStyle]} 
                className="mx-4 mb-3 overflow-hidden rounded-2xl"
            >
                <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
                    <BlurView 
                        intensity={Platform.OS === 'ios' ? 40 : 100} 
                        tint="light"
                        className="p-4 border border-white/40"
                        style={{
                            backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.1,
                            shadowRadius: 20,
                        }}
                    >
                        <View className="flex-row items-center">
                            <View 
                                style={{ backgroundColor: `${config.color}15` }}
                                className="w-11 h-11 rounded-full items-center justify-center mr-3.5"
                            >
                                <MaterialCommunityIcons 
                                    name={config.icon as any} 
                                    size={26} 
                                    color={config.color} 
                                />
                            </View>
                            
                            <View className="flex-1">
                                <Text className="font-inter-bold text-[16px] text-[#1A1A1A] mb-0.5" style={{ color: notification.type === 'critical' ? '#9B1C1C' : '#1A1A1A' }}>
                                    {notification.title}
                                </Text>
                                <Text className="font-inter-medium text-[13px] text-[#666666] leading-5" numberOfLines={2}>
                                    {notification.message}
                                </Text>
                            </View>

                            {notification.imageUrl && (
                                <View className="ml-3 rounded-xl overflow-hidden shadow-sm border border-black/5 bg-gray-50">
                                    <View style={{ width: 54, height: 54 }}>
                                        <Image
                                            source={{ uri: notification.imageUrl }}
                                            style={{ width: '100%', height: '100%' }}
                                            contentFit="cover"
                                            transition={300}
                                        />
                                    </View>
                                </View>
                            )}

                            <TouchableOpacity 
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onDismiss();
                                }}
                                className="bg-black/5 p-1.5 rounded-full ml-3"
                            >
                                <MaterialCommunityIcons name="close" size={14} color="#999999" />
                            </TouchableOpacity>
                        </View>

                        {/* Animated Progress Bar */}
                        <Animated.View 
                            style={[
                                progressStyle, 
                                { 
                                    backgroundColor: config.color,
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    height: 3,
                                    opacity: 0.6
                                }
                            ]} 
                        />
                    </BlurView>
                </TouchableOpacity>
            </Animated.View>
        </GestureDetector>
    );
});

export default NotificationItem;

