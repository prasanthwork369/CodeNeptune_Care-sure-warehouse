import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { icons } from '@/src/constants/icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    Easing,
} from 'react-native-reanimated';

import { Order } from '@/src/types/order.types';

interface OrderInfoPopupProps {
    isVisible: boolean;
    onClose: () => void;
    topOffset?: number;
    order: Order | null;
}

const OrderInfoPopup: React.FC<OrderInfoPopupProps> = ({
    isVisible,
    onClose,
    topOffset = 120,
    order,
}) => {
    const Person = icons.person;
    const Package = icons.package;
    const CalendarClock = icons.calendar_clock;

    const [shouldRender, setShouldRender] = useState(false);
    const translateY = useSharedValue(-300);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            opacity.value = withTiming(1, { duration: 220 });
            translateY.value = withTiming(0, {
                duration: 320,
                easing: Easing.out(Easing.cubic),
            });
        } else {
            // Guard: only close-animate if panel was actually opened
            if (translateY.value > -100) {
                opacity.value = withTiming(0, { duration: 200 });
                translateY.value = withTiming(-300, {
                    duration: 260,
                    easing: Easing.in(Easing.cubic),
                }, (finished) => {
                    if (finished) runOnJS(setShouldRender)(false);
                });
            }
        }
    }, [isVisible]);

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const panelStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    if (!shouldRender) return null;

    const DetailRow = ({
        icon: Icon,
        label,
        value,
    }: {
        icon: any;
        label: string;
        value: string;
    }) => (
        <View style={styles.row}>
            <View style={styles.iconCircle}>
                <Icon width={18} height={18} fill="#6A6A6A" />
            </View>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value || 'N/A'}</Text>
        </View>
    );

    return (
        /**
         * No Modal — avoids touch interception of the header.
         * Container starts exactly at topOffset (header bottom) and fills to screen bottom.
         * pointerEvents="box-none" so the container itself doesn't swallow touches;
         * only the backdrop Pressable and the panel capture touches.
         */
        <View
            style={[styles.overlay, { top: topOffset }]}
            pointerEvents="box-none"
        >
            {/* Dim backdrop — only this closes the sheet when tapped */}
            <Animated.View style={[StyleSheet.absoluteFill, backdropStyle, styles.backdrop]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            {/* Panel slides down from topOffset into view */}
            <Animated.View style={[styles.panel, panelStyle]}>
                <DetailRow icon={Person} label="Name" value={order?.customerName || 'N/A'} />
                <DetailRow icon={Package} label="Order ID" value={order?.orderId || 'N/A'} />
                <DetailRow icon={CalendarClock} label="Order Date" value={order?.orderDate || 'N/A'} />
                <DetailRow icon={CalendarClock} label="Delivery Date" value="Oct 14, 2023" />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
    },
    backdrop: {
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    panel: {
        backgroundColor: 'white',
        paddingTop: 16,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        borderTopWidth: 1,
        borderTopColor: '#CFCFCF',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    iconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F2F2F2',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    label: {
        width: 110,
        fontSize: 14,
        color: '#6A6A6A',
        fontFamily: 'Inter',
    },
    value: {
        flex: 1,
        fontSize: 14,
        color: '#1A1A1A',
        fontFamily: 'Inter-Medium',
    },
});

export default OrderInfoPopup;
