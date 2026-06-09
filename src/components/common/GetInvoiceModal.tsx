import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';
import { icons } from '@/src/constants/icons';

interface GetInvoiceModalProps {
    isVisible: boolean;
    totalItems?: number;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

const GetInvoiceModal: React.FC<GetInvoiceModalProps> = ({ isVisible, onClose, onConfirm, isLoading = false }) => {
    const opacity = useSharedValue(0);
    const AdfScanner = icons.adf_scanner;

    useEffect(() => {
        opacity.value = withTiming(isVisible ? 1 : 0, {
            duration: isVisible ? 220 : 180,
            easing: Easing.out(Easing.quad),
        });
    }, [isVisible]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const cardStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { scale: interpolate(opacity.value, [0, 1], [0.95, 1]) },
            { translateY: interpolate(opacity.value, [0, 1], [12, 0]) },
        ],
    }));

    return (
        <Modal transparent visible={isVisible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
            <View style={{ flex: 1 }}>
                {/* Backdrop — zIndex 0, sits behind card */}
                <Animated.View style={[StyleSheet.absoluteFill, backdropStyle, { backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 0 }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>

                {/* Card — zIndex 1, above backdrop so touches reach the button */}
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, zIndex: 1 }}>
                    <Animated.View style={[cardStyle, { width: '100%', backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 24, paddingTop: 36, paddingBottom: 28 }]}>

                        {/* Icon */}
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <View style={{
                                width: 88,
                                height: 88,
                                borderRadius: 44,
                                backgroundColor: '#E7F3FF',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <AdfScanner width={44} height={33} />
                            </View>
                        </View>

                        {/* Message */}
                        <Text style={{
                            fontSize: 17,
                            fontFamily: 'Inter_600SemiBold',
                            color: '#222222',
                            textAlign: 'center',
                            lineHeight: 26,
                            marginBottom: 28,
                            paddingHorizontal: 8,
                        }}>
                            {'This will generate an invoice for this order.\nContinue?'}
                        </Text>

                        {/* Get Invoice Button */}
                        <TouchableOpacity
                            onPress={onConfirm}
                            disabled={isLoading}
                            activeOpacity={0.85}
                            style={{
                                height: 56,
                                borderRadius: 16,
                                backgroundColor: colors.brand.primary,
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: isLoading ? 0.6 : 1,
                            }}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' }}>
                                    Get Invoice
                                </Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
        </Modal>
    );
};

export default GetInvoiceModal;
