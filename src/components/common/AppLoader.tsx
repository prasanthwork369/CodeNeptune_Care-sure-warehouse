import React, { useEffect } from 'react';
import { View, Text, Modal } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    Easing,
    cancelAnimation,
} from 'react-native-reanimated';
import { images } from '@/src/constants/images';

export type LoaderVariant = 'dots';

interface AppLoaderProps {
    visible: boolean;
    variant?: LoaderVariant;
    title?: string;
    subtitle?: string;
}

const Dot: React.FC<{ delay: number }> = ({ delay }) => {
    const y = useSharedValue(0);
    const scale = useSharedValue(0.7);

    useEffect(() => {
        y.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(-12, { duration: 320, easing: Easing.out(Easing.quad) }),
                    withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
                    withTiming(0, { duration: 400 })
                ),
                -1,
                false
            )
        );
        scale.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: 320 }),
                    withTiming(0.7, { duration: 320 }),
                    withTiming(0.7, { duration: 400 })
                ),
                -1,
                false
            )
        );
        return () => { cancelAnimation(y); cancelAnimation(scale); };
    }, [delay]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: y.value }, { scale: scale.value }],
    }));

    return <Animated.View style={animatedStyle} className="w-2.5 h-2.5 rounded-full bg-[#222222]" />;
};

const AppLoader: React.FC<AppLoaderProps> = ({
    visible,
    title = 'Loading...',
    subtitle = 'Please wait a moment',
}) => {
    const Logo = images.logo;

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View className="flex-1 bg-white items-center justify-center px-8">
                <View className="mb-8">
                    <Logo width={80} height={80} />
                </View>

                <View className="flex-row items-center gap-2.5 mb-7">
                    <Dot delay={0} />
                    <Dot delay={160} />
                    <Dot delay={320} />
                </View>

                <View className="items-center">
                    <Text className="text-[20px] font-inter-bold text-[#222222] text-center mb-2">{title}</Text>
                    <Text className="text-[14px] font-inter text-[#888888] text-center leading-5">{subtitle}</Text>
                </View>
            </View>
        </Modal>
    );
};

export default AppLoader;