import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '@/src/store/useNotificationStore';
import NotificationItem from './NotificationItem';

const NotificationManager = memo(() => {
    const insets = useSafeAreaInsets();
    const visible = useNotificationStore((state) => state.visible);

    if (visible.length === 0) return null;

    return (
        <View 
            pointerEvents="box-none" 
            style={[
                styles.container, 
                { paddingTop: insets.top + 10 }
            ]}
        >
            {visible.map((notification, index) => (
                <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    index={index}
                />
            ))}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
    },
});

export default NotificationManager;

