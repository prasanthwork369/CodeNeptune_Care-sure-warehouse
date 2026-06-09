import { tabs } from '@/src/constants/data';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTabBarStore } from '@/src/store/useTabBarStore';
import { useAuthStore } from '@/src/store/useAuthStore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Text, View, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    interpolate,
    interpolateColor,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS,
    runOnUI,
    SharedValue,
    Extrapolation,
    cancelAnimation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const BAR_COLOR           = '#222222';
const PILL_COLOR          = '#FFFFFF';
const ACTIVE_ICON_COLOR   = '#222222';
const INACTIVE_ICON_COLOR = '#969696';

// Snappy — matches the feel of the customer app
const SNAP_SPRING   = { damping: 28, stiffness: 420, mass: 0.5 } as const;
// Trailing spring for the liquid stretch effect
const TRAIL_SPRING  = { damping: 22, stiffness: 320, mass: 0.6 } as const;

const AnimatedText = Animated.createAnimatedComponent(Text);

const FloatingTabBar = ({ state, navigation }: BottomTabBarProps) => {
    const insets         = useSafeAreaInsets();
    const [barHeight, setBarHeight] = useState(0);
    const setTabBarHeight = useTabBarStore(s => s.setTabBarHeight);

    const roles       = useAuthStore(s => s.roles);
    const permissions = useAuthStore(s => s.permissions);
    const isAdmin     = roles.includes('admin');

    const isTabAccessible = useMemo(() => (tabName: string): boolean => {
        switch (tabName) {
            case 'picker':     return isAdmin || permissions.includes('picker-panel:read');
            case 'packer':     return isAdmin || permissions.includes('packer-panel:read');
            case 'dispatcher': return isAdmin || permissions.includes('dispatcher-panel:read') || permissions.includes('dispatcher-panel:update');
            default:           return true;
        }
    }, [isAdmin, permissions]);

    useEffect(() => {
        if (Platform.OS === 'android') {
            NavigationBar.setButtonStyleAsync('dark').catch(() => {});
        }
    }, []);

    const leaderX       = useSharedValue(state.index);
    const followerX     = useSharedValue(state.index);
    const isInteracting = useSharedValue(0);
    const activeIndexSV = useSharedValue(state.index);
    // tabWidth as SharedValue so pan worklet runs entirely on UI thread
    const tabWidthSV    = useSharedValue(0);

    // Cancel any in-flight animation and snap instantly on navigation-driven changes
    useEffect(() => {
        const idx = state.index;
        runOnUI(() => {
            'worklet';
            cancelAnimation(leaderX);
            cancelAnimation(followerX);
            isInteracting.value = 0;
            activeIndexSV.value = idx;
            leaderX.value       = idx;
            followerX.value     = idx;
        })();
    }, [state.index]);

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        const tw = (width - 32) / state.routes.length;
        setBarHeight(height);
        tabWidthSV.value = tw;
        leaderX.value    = state.index;
        followerX.value  = state.index;
    }, [state.routes.length, state.index]);

    const navigateToTab = useCallback((index: number) => {
        const route = state.routes[index];
        if (!route) return;
        if (!isTabAccessible(route.name)) {
            runOnUI(() => {
                'worklet';
                leaderX.value   = withSpring(state.index, SNAP_SPRING);
                followerX.value = withSpring(state.index, TRAIL_SPRING);
            })();
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate(route.name);
    }, [state.routes, state.index, isTabAccessible, navigation]);

    const panGesture = useMemo(() => Gesture.Pan()
        .activeOffsetX([-5, 5])
        .failOffsetY([-15, 15])
        .onBegin(() => {
            'worklet';
            isInteracting.value = 1;
        })
        .onUpdate((e) => {
            'worklet';
            const tw = tabWidthSV.value;
            if (tw <= 0) return;
            const clamped = Math.max(0, Math.min(state.routes.length - 1, (e.x - 16) / tw));
            leaderX.value   = clamped;
            followerX.value = withSpring(clamped, TRAIL_SPRING);
        })
        .onEnd(() => {
            'worklet';
            const final = Math.min(state.routes.length - 1, Math.max(0, Math.round(leaderX.value)));
            leaderX.value   = withSpring(final, SNAP_SPRING);
            followerX.value = withSpring(final, TRAIL_SPRING);
            runOnJS(navigateToTab)(final);
        })
        .onFinalize(() => {
            'worklet';
            isInteracting.value = 0;
        }),
    [state.routes.length, navigateToTab]);

    const tapGesture = useMemo(() => Gesture.Tap()
        .maxDistance(14)
        .onBegin(() => {
            'worklet';
            isInteracting.value = 1;
        })
        .onEnd((e) => {
            'worklet';
            const tw = tabWidthSV.value;
            if (tw <= 0) return;
            const final = Math.min(state.routes.length - 1, Math.max(0, Math.floor((e.x - 16) / tw)));
            leaderX.value   = withSpring(final, SNAP_SPRING);
            followerX.value = withSpring(final, TRAIL_SPRING);
            runOnJS(navigateToTab)(final);
        })
        .onFinalize(() => {
            'worklet';
            isInteracting.value = 0;
        }),
    [state.routes.length, navigateToTab]);

    // Race: whichever recognizes first wins — tap is instant, pan needs movement
    const combinedGesture = useMemo(() => Gesture.Race(tapGesture, panGesture), [tapGesture, panGesture]);

    const animatedPillStyle = useAnimatedStyle(() => {
        'worklet';
        const tw      = tabWidthSV.value;
        const start   = Math.min(leaderX.value, followerX.value);
        const end     = Math.max(leaderX.value, followerX.value);
        const stretch = (end - start) * tw;
        return {
            transform: [
                { translateX: (start * tw) + 16 },
                { scaleY: interpolate(stretch, [0, tw], [1, 0.95], Extrapolation.CLAMP) },
            ],
            width:           tw + stretch,
            backgroundColor: PILL_COLOR,
        };
    });

    return (
        <>
            <LinearGradient
                colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.95)', '#FFFFFF']}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: insets.bottom + 48 }}
                pointerEvents="none"
            />

            <View
                className="absolute left-0 right-0 items-center px-6"
                style={{ bottom: 16 + insets.bottom }}
                onLayout={(e) => setTabBarHeight(e.nativeEvent.layout.height + 16 + insets.bottom)}
            >
                <GestureDetector gesture={combinedGesture}>
                    <BlurView
                        intensity={80}
                        tint="dark"
                        onLayout={onLayout}
                        style={{
                            backgroundColor: BAR_COLOR,
                            overflow: 'hidden',
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.05)',
                        }}
                        className="flex-row py-5 px-4 items-center w-full max-w-[600px] shadow-2xl"
                    >
                        {barHeight > 0 && (
                            <Animated.View
                                style={[
                                    animatedPillStyle,
                                    {
                                        position: 'absolute',
                                        height: barHeight - 32,
                                        borderRadius: 999,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.15,
                                        shadowRadius: 6,
                                        elevation: 5,
                                    }
                                ]}
                            >
                                <View style={{ position: 'absolute', top: 4, left: '15%', width: '25%', height: 3, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 10 }} />
                            </Animated.View>
                        )}

                        {state.routes.map((route, index) => {
                            const tab = tabs.find(t => t.name === route.name);
                            if (!tab) return null;
                            return (
                                <TabItem
                                    key={route.key}
                                    index={index}
                                    icon={tab.icon}
                                    label={tab.title}
                                    followerX={followerX}
                                    activeIndexSV={activeIndexSV}
                                    isInteracting={isInteracting}
                                    accessible={isTabAccessible(route.name)}
                                />
                            );
                        })}
                    </BlurView>
                </GestureDetector>
            </View>
        </>
    );
};

interface TabItemProps {
    icon: React.ComponentType<{ fill?: string; color?: string; width?: number; height?: number }>;
    index: number;
    label: string;
    followerX: SharedValue<number>;
    activeIndexSV: SharedValue<number>;
    isInteracting: SharedValue<number>;
    accessible?: boolean;
}

const TabItem = React.memo(({ icon: Icon, index, label, followerX, activeIndexSV, isInteracting, accessible = true }: TabItemProps) => {
    const AnimatedIcon = useMemo(() => Animated.createAnimatedComponent(Icon), [Icon]);

    const animatedTextStyle = useAnimatedStyle(() => {
        'worklet';
        const distance = isInteracting.value === 1
            ? Math.abs(followerX.value - index)
            : (activeIndexSV.value === index ? 0 : 1);
        const scale = interpolate(distance, [0, 0.35], [1.15, 1], Extrapolation.CLAMP);
        const color = interpolateColor(distance, [0, 0.3], [ACTIVE_ICON_COLOR, INACTIVE_ICON_COLOR]);
        return { color, transform: [{ scale }] };
    });

    const animatedIconProps = useAnimatedProps(() => {
        'worklet';
        const distance = isInteracting.value === 1
            ? Math.abs(followerX.value - index)
            : (activeIndexSV.value === index ? 0 : 1);
        const color = interpolateColor(distance, [0, 0.3], [ACTIVE_ICON_COLOR, INACTIVE_ICON_COLOR]);
        return { fill: color, color };
    });

    return (
        <View className="flex-1 items-center justify-center py-2 h-full z-10" style={{ opacity: accessible ? 1 : 0.3 }}>
            <Animated.View style={{ alignItems: 'center' }}>
                <AnimatedIcon width={34} height={34} animatedProps={animatedIconProps} />
                <AnimatedText
                    className="mt-0 text-[12px] tracking-tighter"
                    style={[{ fontFamily: 'Inter_600SemiBold' }, animatedTextStyle]}
                >
                    {label}
                </AnimatedText>
            </Animated.View>
        </View>
    );
});

export default FloatingTabBar;
