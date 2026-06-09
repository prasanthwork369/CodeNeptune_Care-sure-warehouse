import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';

interface PickingProgressFooterProps {
    totalItems: number;
    pickedItems: number;
    isAnyPartial: boolean;
    isAllHandled: boolean;
    onMainPress: () => void;
}

const PickingProgressFooter: React.FC<PickingProgressFooterProps> = ({
    totalItems,
    pickedItems,
    isAnyPartial,
    isAllHandled,
    onMainPress
}) => {
    const insets = useSafeAreaInsets();
    const progress = totalItems > 0 ? (pickedItems / totalItems) * 100 : 0;
    const isReadyForPacker = isAllHandled && !isAnyPartial;
    const isPartialAction = isAllHandled && isAnyPartial;

    const animatedProgress = useSharedValue(progress);

    useEffect(() => {
        animatedProgress.value = withTiming(progress, {
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
    }, [progress]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${animatedProgress.value}%`,
        };
    });

    const getButtonStyles = () => {
        if (isReadyForPacker) return { backgroundColor: colors.brand.primary };
        if (isPartialAction) return { backgroundColor: colors.status.warning };
        return { backgroundColor: colors.surface.gray };
    };

    return (
        <View style={{ backgroundColor: '#E5D6BE', borderTopColor: colors.border.light, paddingBottom: (insets.bottom || 0) + 24 }} className="px-5 pt-6 border-t flex-row items-center">
            {/* Left: Progress label + bar — 72% */}
            <View style={{ flex: 72 }} className="mr-6">
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-[15px] text-text-primary font-inter-medium">Picking Progress</Text>
                    <Text style={{ color: colors.text.DEFAULT }} className="text-[15px] font-inter-semibold">
                        Items {pickedItems.toString().padStart(2, '0')}/{totalItems.toString().padStart(2, '0')}
                    </Text>
                </View>
                <View style={{ backgroundColor: colors.surface.gray }} className="h-[8px] mt-1 rounded-full overflow-hidden">
                    <Animated.View
                        style={[animatedStyle, { backgroundColor: colors.text.blue }]}
                        className="h-full rounded-full"
                    />
                </View>
            </View>

            {/* Right: Action button — 42% */}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onMainPress}
                disabled={!isAllHandled}
                style={[getButtonStyles(), { flex: 28, opacity: isAllHandled ? 1 : 0.4 }]}
                className="py-4 rounded-xl items-center justify-center"
            >
                <Text className={`text-[15px] font-inter-semibold ${isReadyForPacker || isPartialAction ? 'text-white' : 'text-black/20'}`}>
                    {isPartialAction ? 'Mark as Partial' : 'Move to Packer'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default React.memo(PickingProgressFooter);
