import { useRef, useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedScrollHandler, runOnJS } from 'react-native-reanimated';
import { OrderStatus } from '@/src/types/order.types';

export function usePickerScroll(
    activeTab: OrderStatus,
    setActiveTab: (tab: OrderStatus) => void,
    width: number
) {
    const scrollX = useSharedValue(0);
    const scrollRef = useRef<Animated.ScrollView>(null);
    const isManualScroll = useRef(false);

    useEffect(() => {
        if (isManualScroll.current) {
            isManualScroll.current = false;
            return;
        }
        const index = ['new', 'partial', 'completed'].indexOf(activeTab);
        if (index !== -1) {
            scrollRef.current?.scrollTo({ x: index * width, animated: true });
        }
    }, [activeTab, width]);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
        onMomentumEnd: (event) => {
            const progress = event.contentOffset.x / width;
            const index = Math.round(progress);
            const statuses: OrderStatus[] = ['new', 'partial', 'completed'];
            const newStatus = statuses[index];
            if (newStatus && newStatus !== activeTab) {
                isManualScroll.current = true;
                runOnJS(setActiveTab)(newStatus);
            }
        }
    });

    return { scrollX, scrollRef, scrollHandler };
}
