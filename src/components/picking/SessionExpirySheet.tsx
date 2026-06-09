import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { icons } from '@/src/constants/icons';
import colors from '@/src/theme/colors';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExtendMinutes } from '@/src/types/fulfillment.types';

interface SessionExpirySheetProps {
    isVisible: boolean;
    onClose: () => void;
    onExtend: (minutes: ExtendMinutes) => void;
    secondsLeft: number;
    isExtending: boolean;
    mode?: 'info' | 'expiry';
}

const formatFullTime = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const SessionExpirySheet: React.FC<SessionExpirySheetProps> = ({
    isVisible,
    onClose,
    onExtend,
    secondsLeft,
    isExtending,
    mode = 'expiry',
}) => {
    const InfoWarn = icons.info_warn;
    const [shouldRender, setShouldRender] = useState(isVisible);
    const [showInfoBox, setShowInfoBox] = useState(false);
    const [loadingMin, setLoadingMin] = useState<ExtendMinutes | null>(null);

    useEffect(() => { if (!isExtending) setLoadingMin(null); }, [isExtending]);
    const translateY = useSharedValue(-600);
    const opacity = useSharedValue(0);
    const sheetOpacity = useSharedValue(0);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            opacity.value = withTiming(0.5, { duration: 250 });
            sheetOpacity.value = withTiming(1, { duration: 180 });
            translateY.value = withSpring(0, {
                damping: 20,
                stiffness: 180,
                mass: 0.8,
                overshootClamping: false,
            });
        } else {
            setShowInfoBox(false);
            opacity.value = withTiming(0, { duration: 300 });
            sheetOpacity.value = withTiming(0, { duration: 200 });
            translateY.value = withTiming(-600, {
                duration: 340,
                easing: Easing.in(Easing.cubic),
            }, (finished) => {
                if (finished) runOnJS(setShouldRender)(false);
            });
        }
    }, [isVisible]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: sheetOpacity.value,
    }));

    if (!isVisible && !shouldRender) return null;

    return (
        <Modal transparent visible={shouldRender} animationType="none" onRequestClose={onClose}>
            <View style={{ flex: 1, justifyContent: 'flex-start' }}>
                {/* Backdrop */}
                <Animated.View
                    style={[StyleSheet.absoluteFill, backdropStyle, { backgroundColor: '#000000' }]}
                >
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>

                {/* Top-down Sheet */}
                <Animated.View
                    style={[
                        sheetStyle,
                        {
                            backgroundColor: '#FFFFFF',
                            paddingTop: (insets.top || 20) + 20,
                            paddingBottom: 28,
                            paddingHorizontal: 24,
                            borderBottomLeftRadius: 28,
                            borderBottomRightRadius: 28,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.12,
                            shadowRadius: 16,
                            elevation: 8,
                        },
                    ]}
                >
                    {/* Close Button */}
                    <TouchableOpacity
                        onPress={onClose}
                        activeOpacity={0.7}
                        style={{
                            position: 'absolute',
                            right: 20,
                            top: (insets.top || 20) + 24,
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: colors.surface.gray,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 18, color: colors.text.secondary, lineHeight: 22, fontFamily: 'Inter-Medium' }}>
                            ×
                        </Text>
                    </TouchableOpacity>

                    {/* Timer Row — expiry mode only */}
                    {mode === 'expiry' && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: showInfoBox ? 16 : 20, marginTop: 4 }}>
                            <TouchableOpacity onPress={() => setShowInfoBox(p => !p)} activeOpacity={0.7}>
                                <InfoWarn width={22} height={22} fill={showInfoBox ? colors.brand.primary : colors.status.warning} />
                            </TouchableOpacity>
                            <Text style={{ marginLeft: 8, fontSize: 15, color: colors.text.DEFAULT, fontFamily: 'Inter-Medium', flexShrink: 1 }}>
                                {'Picking session will expire in '}
                                <Text style={{ color: '#E53935', fontFamily: 'Inter-Bold' }}>
                                    {formatFullTime(secondsLeft)}
                                </Text>
                            </Text>
                        </View>
                    )}

                    {/* Info Box — toggle via info icon in expiry mode, always visible in info mode */}
                    {(mode === 'info' || showInfoBox) && (
                        <View style={{ backgroundColor: '#FEFCE8', borderRadius: 14, padding: 14, marginBottom: 20 }}>
                            <Text style={{ fontSize: 13, color: colors.text.DEFAULT, fontFamily: 'Inter', lineHeight: 20 }}>
                                Each order has an estimated picking time of 10 minutes. After that, the picking session will close.
                            </Text>
                        </View>
                    )}

                    {/* Add More Minutes */}
                    <Text style={{ fontSize: 13, color: colors.text.secondary, fontFamily: 'Inter-Medium', marginBottom: 10 }}>
                        Add more minutes
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {(['2', '5'] as ExtendMinutes[]).map((min) => {
                            const isThisLoading = loadingMin === min;
                            const isOtherLoading = isExtending && loadingMin !== min;
                            return (
                                <TouchableOpacity
                                    key={min}
                                    onPress={() => {
                                        setLoadingMin(min);
                                        onExtend(min);
                                    }}
                                    disabled={isExtending}
                                    activeOpacity={0.7}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 16,
                                        borderRadius: 20,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 1.5,
                                        borderColor: isThisLoading ? colors.brand.primary : colors.border.DEFAULT,
                                        backgroundColor: isThisLoading ? colors.brand.primarySoft : isOtherLoading ? colors.surface.gray : colors.surface.DEFAULT,
                                        opacity: isOtherLoading ? 0.4 : 1,
                                    }}
                                >
                                    <Text style={{ fontSize: 18, color: isThisLoading ? colors.brand.primary : colors.text.DEFAULT, fontFamily: 'Inter-SemiBold' }}>
                                        +{min}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

export default SessionExpirySheet;
