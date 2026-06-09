import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    withRepeat,
    withTiming,
    useAnimatedStyle,
    interpolate,
    Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: any;
    color?: string;
    highlightColor?: string;
}

const Skeleton = ({ 
    width = '100%', 
    height = 20, 
    borderRadius = 4, 
    style,
    color = '#EBEBEB',
    highlightColor = 'rgba(255, 255, 255, 0.8)'
}: SkeletonProps) => {
    const translateX = useSharedValue(-1);

    useEffect(() => {
        translateX.value = withRepeat(
            withTiming(1, {
                duration: 1500,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
            }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateX: interpolate(
                        translateX.value,
                        [-1, 1],
                        [-SCREEN_WIDTH, SCREEN_WIDTH]
                    ),
                },
            ],
        };
    });

    return (
        <View
            style={[
                {
                    width: width as any,
                    height: height as any,
                    borderRadius,
                    backgroundColor: color,
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
                <LinearGradient
                    colors={['transparent', highlightColor, 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};

export default Skeleton;

/**
 * 2x2 image grid skeleton — matches the OrderCard image grid layout.
 */
export const ImageGridSkeleton = ({ size = 80 }: { size?: number }) => {
    const cell = Math.floor((size - 4) / 2);
    return (
        <View style={{ width: size, height: size }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Skeleton width={cell} height={cell} borderRadius={6} />
                <Skeleton width={cell} height={cell} borderRadius={6} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton width={cell} height={cell} borderRadius={6} />
                <Skeleton width={cell} height={cell} borderRadius={6} />
            </View>
        </View>
    );
};
