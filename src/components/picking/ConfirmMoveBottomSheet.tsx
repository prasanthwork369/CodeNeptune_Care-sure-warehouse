import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { icons } from '@/src/constants/icons';
import { colors } from '@/src/theme/colors';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';

interface ConfirmMoveBottomSheetProps {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    message: string;
    type: 'packer' | 'partial';
    isLoading?: boolean;
}

const ConfirmMoveBottomSheet: React.FC<ConfirmMoveBottomSheetProps> = ({
    isVisible,
    onClose,
    onConfirm,
    message,
    type,
    isLoading = false,
}) => {
    const insets = useSafeAreaInsets();
    const Icon = icons.shift;
    const Info_warn = icons.info_warn;
    const [shouldRender, setShouldRender] = useState(isVisible);
    const translateY = useSharedValue(1000);
    const opacity = useSharedValue(0);
    const context = useSharedValue({ y: 0 });

    const closeSheet = (velocity = 0) => {
        'worklet';
        // Base closing duration is now longer
        const duration = velocity > 500 ? 300 : 500;
        opacity.value = withTiming(0, { duration });
        translateY.value = withTiming(1000, { duration }, (finished) => {
            if (finished) {
                runOnJS(setShouldRender)(false);
                runOnJS(onClose)();
            }
        });
    };

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            opacity.value = withTiming(1, { duration: 200 }); // Faster backdrop
            translateY.value = withTiming(0, {
                duration: 350,
                easing: Easing.out(Easing.cubic)
            }); // Smooth non-bouncy open
        } else {
            // Only trigger if not already hidden
            if (translateY.value < 1000) {
                opacity.value = withTiming(0, { duration: 400 });
                translateY.value = withTiming(1000, { duration: 500 }, (finished) => {
                    if (finished) {
                        runOnJS(setShouldRender)(false);
                    }
                }); // Slower smooth close
            }
        }
    }, [isVisible]);

    const gesture = Gesture.Pan()
        .onStart(() => {
            context.value = { y: translateY.value };
        })
        .onUpdate((event) => {
            translateY.value = Math.max(0, event.translationY + context.value.y);
        })
        .onEnd((event) => {
            if (translateY.value > 150 || event.velocityY > 500) {
                closeSheet(event.velocityY);
            } else {
                translateY.value = withTiming(0, {
                    duration: 300,
                    easing: Easing.out(Easing.cubic)
                });
            }
        });

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    if (!isVisible && !shouldRender) return null;

    return (
        <Modal transparent visible={shouldRender} animationType="none" onRequestClose={onClose}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View className="flex-1 justify-end">
                    {/* Backdrop */}
                    <Animated.View
                        style={[StyleSheet.absoluteFill, backdropStyle, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                    >
                        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                    </Animated.View>

                    {/* Bottom Sheet */}
                    <GestureDetector gesture={gesture}>
                        <Animated.View
                            style={[sheetStyle, { paddingBottom: (insets.bottom || 0) + 48 }]}
                            className="bg-white rounded-t-[40px] px-8 pt-8 items-center"
                        >
                            {/* Handle decoration */}
                            <View className="w-12 h-1 bg-[#E0E0E0] rounded-full mb-8" />

                            {/* Icon Header */}
                            <View className="w-20 h-20 bg-[#F2F2F2] rounded-full items-center justify-center mb-6">
                                <Icon width={type === 'packer' ? 30 : 25} height={type === 'packer' ? 30 : 30} fill={colors.text.secondary} />
                            </View>

                            {/* Confirmation Text */}
                            <Text
                                style={{ color: colors.text.secondary }}
                                className="text-[14px] font-inter-medium text-center leading-7 px-4 mb-8"
                            >
                                {message}
                            </Text>

                            {/* Warning Box (Only for Packer) */}
                            {type === 'packer' && (
                                <View
                                    style={{ backgroundColor: colors.status.warningBg }}
                                    className="p-5 rounded-[20px] flex-row items-center mb-10 w-full"
                                >
                                    <View className="mr-3">
                                        <Info_warn width={20} height={20} fill={colors.status.warning} />
                                    </View>
                                    <Text
                                        style={{ color: colors.text.DEFAULT }}
                                        className="flex-1 text-[12px] font-inter leading-5"
                                    >
                                        All items must be verified before proceeding to the packing station.
                                    </Text>
                                </View>
                            )}

                            {/* Confirm Button */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={onConfirm}
                                disabled={isLoading}
                                style={{ backgroundColor: colors.brand.primary, opacity: isLoading ? 0.6 : 1 }}
                                className="w-full py-5 rounded-[28px] items-center"
                            >
                                <Text className="text-white text-[16px] font-inter-semibold">
                                    {isLoading ? 'Please wait...' : type === 'packer' ? 'Confirm & Move' : 'Move to Partial'}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </GestureDetector>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
};

export default ConfirmMoveBottomSheet;
