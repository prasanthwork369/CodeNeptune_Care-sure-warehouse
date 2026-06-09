import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
    useAnimatedStyle,
    SharedValue,
    interpolate
} from 'react-native-reanimated';
import { useOrderStore } from '@/src/store/useOrderStore';
import { OrderStatus } from '@/src/types/order.types';
import { colors } from '@/src/theme/colors';

interface PickerTabsProps {
    scrollX: SharedValue<number>;
    viewportWidth: number;
}

const PickerTabs: React.FC<PickerTabsProps> = ({ scrollX, viewportWidth }) => {
    const { activeTab, setActiveTab, orders } = useOrderStore();

    const tabs: { key: OrderStatus, label: string }[] = useMemo(() => [
        { key: 'new', label: 'New Orders' },
        { key: 'partial', label: 'Partial' },
        { key: 'completed', label: 'Completed' },
    ], []);

    const tabWidth = viewportWidth / tabs.length;

    const animatedIndicatorStyle = useAnimatedStyle(() => {
        // Linearly interpolate the scroll position to the tab indicator position
        const translateX = interpolate(
            scrollX.value,
            [0, viewportWidth, viewportWidth * 2],
            [0, tabWidth, tabWidth * 2]
        );

        return {
            transform: [{ translateX }],
            width: tabWidth,
        };
    });

    const getPartialCount = () => {
        return orders?.filter(o => o.status === 'partial').length || 0;
    };

    return (
        <View style={{ borderBottomColor: colors.surface.main }} className="flex-row border-b mb-6 relative">
            {/* Animated Indicator - Smoothly moves with scrollX */}
            <Animated.View
                style={[
                    animatedIndicatorStyle,
                    {
                        position: 'absolute',
                        bottom: 0,
                        height: 6,
                        backgroundColor: colors.text.DEFAULT,
                        zIndex: 10,
                    }
                ]}
            />

            {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const showBadge = tab.key === 'partial' && getPartialCount() > 0;

                return (
                    <TouchableOpacity
                        key={tab.key}
                        activeOpacity={0.7}
                        onPress={() => setActiveTab(tab.key)}
                        className={`flex-1 py-4 items-center`}
                    >
                        <View className="flex-row items-center">
                            <Text
                                style={{ color: isActive ? colors.text.DEFAULT : colors.text.secondary }}
                                className={`text-[15px] font-inter-semibold`}
                            >
                                {tab.label}
                            </Text>
                            {showBadge && (
                                <View style={{ backgroundColor: colors.brand.primary, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 6, minWidth: 20, alignItems: 'center' }}>
                                    <Text style={{ color: 'white', fontSize: 10, fontFamily: 'Inter_400Regular' }}>
                                        {getPartialCount()}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default React.memo(PickerTabs);