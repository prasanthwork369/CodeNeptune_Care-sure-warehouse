import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Pressable,
    StyleSheet,
    Dimensions,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UploadBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    onSelectCamera: () => void;
    onSelectLibrary: () => void;
}

// ─── Single action row ────────────────────────────────────────────────────────
const ActionRow = ({
    iconName,
    label,
    sublabel,
    onPress,
    iconBg,
    iconColor,
    last = false,
}: {
    iconName: React.ComponentProps<typeof Feather>['name'];
    label: string;
    sublabel: string;
    onPress: () => void;
    iconBg: string;
    iconColor: string;
    last?: boolean;
}) => {
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={animStyle}>
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={1}
                onPressIn={() => {
                    scale.value = withTiming(0.97, { duration: 80 });
                }}
                // after
                onPressOut={() => {
                    scale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
                }}
                style={[styles.actionRow, !last && styles.actionRowBorder]}
            >
                {/* Icon */}
                <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>
                    <Feather name={iconName} size={20} color={iconColor} />
                </View>

                {/* Text */}
                <View style={styles.actionText}>
                    <Text style={styles.actionLabel}>{label}</Text>
                    <Text style={styles.actionSublabel}>{sublabel}</Text>
                </View>

                {/* Arrow */}
                <View style={styles.actionArrow}>
                    <Feather name="chevron-right" size={18} color="#C0C0C0" />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const UploadBottomSheet: React.FC<UploadBottomSheetProps> = ({
    visible,
    onClose,
    onSelectCamera,
    onSelectLibrary,
}) => {
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(600);
    const opacity = useSharedValue(0);
    const [renderModal, setRenderModal] = React.useState(visible);

    useEffect(() => {
        if (visible) {
            setRenderModal(true);
            opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
            translateY.value = withTiming(0, {
                duration: 320,
                easing: Easing.out(Easing.cubic),
            });
        } else {
            opacity.value = withTiming(0, { duration: 250 });
            translateY.value = withTiming(600, { duration: 280, easing: Easing.in(Easing.ease) }, (finished) => {
                if (finished) {
                    runOnJS(setRenderModal)(false);
                }
            });
        }
    }, [visible]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Modal
            transparent
            visible={renderModal}
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.root}>

                {/* Blurred backdrop */}
                <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
                    <Pressable style={{ flex: 1 }} onPress={onClose}>
                        <BlurView intensity={30} tint="dark" style={{ flex: 1 }} />
                    </Pressable>
                </Animated.View>

                {/* Sheet */}
                <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: Math.max(insets.bottom, 24) }]}>

                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Feather name="user" size={22} color={colors.brand.primary} />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Change Profile Photo</Text>
                            <Text style={styles.headerSub}>Select a source below</Text>
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Actions card */}
                    <View style={styles.actionsCard}>
                        <ActionRow
                            iconName="camera"
                            label="Take a Photo"
                            sublabel="Use your device camera"
                            onPress={onSelectCamera}
                            iconBg="#E8F5EE"
                            iconColor={colors.brand.primary}
                        />
                        <ActionRow
                            iconName="image"
                            label="Choose from Gallery"
                            sublabel="Pick from your photo library"
                            onPress={onSelectLibrary}
                            iconBg="#E8F0FE"
                            iconColor="#4285F4"
                            last
                        />
                    </View>

                    {/* Cancel */}
                    <TouchableOpacity
                        onPress={onClose}
                        activeOpacity={0.7}
                        style={styles.cancelBtn}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>

                </Animated.View>
            </View>
        </Modal>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'flex-end',
    },

    // Sheet
    sheet: {
        backgroundColor: '#F5F5F7',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingHorizontal: 20,
        paddingTop: 12,
    },

    handle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#DCDCDC',
        marginBottom: 20,
    },

    // Header row
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#E8F5EE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
        letterSpacing: 0.1,
    },
    headerSub: {
        fontSize: 13,
        color: '#999',
        marginTop: 2,
        fontWeight: '400',
    },

    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E0E0E0',
        marginBottom: 16,
    },

    // Actions card
    actionsCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#EBEBEB',
    },

    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
    },
    actionRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#F0F0F0',
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    actionText: { flex: 1 },
    actionLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
    },
    actionSublabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
        fontWeight: '400',
    },
    actionArrow: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Cancel
    cancelBtn: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#EBEBEB',
        marginBottom: 4,
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#CF1A1A',
    },
});

export default UploadBottomSheet;