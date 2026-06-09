import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Notification } from '@/src/store/useNotificationStore';

interface Props {
    notification: Notification;
}

const NotificationHistoryItem: React.FC<Props> = memo(({ notification }) => {
    const renderTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <View 
            className="mb-4 bg-white rounded-[20px] p-4 flex-row items-center shadow-sm border border-black/5"
        >
            {/* Icon / Type Indicator */}
            <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-green-50" 
                  style={{ backgroundColor: notification.type === 'success' ? '#117C3F15' : '#F0F0F0' }}>
                <MaterialCommunityIcons 
                    name={notification.type === 'success' ? 'check-circle' : 'information'} 
                    size={24} 
                    color={notification.type === 'success' ? '#117C3F' : '#666'} 
                />
            </View>

            {/* Content */}
            <View className="flex-1 pr-2">
                <Text className="font-inter-bold text-[15px] text-[#1A1A1A]">
                    {notification.title}
                </Text>
                <Text className="font-inter-medium text-[13px] text-[#666] mt-0.5" numberOfLines={2}>
                    {notification.message}
                </Text>
                <View className="flex-row items-center mt-1.5 gap-1.5">
                    <MaterialCommunityIcons name="clock-outline" size={12} color="#999" />
                    <Text className="text-[11px] font-inter-medium text-gray-400">
                        {renderTime(notification.timestamp)}
                    </Text>
                </View>
            </View>

            {/* Image Preview */}
            {notification.imageUrl && (
                <View className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-black/5">
                    <Image 
                        source={{ uri: notification.imageUrl }} 
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={300}
                    />
                </View>
            )}
        </View>
    );
});

export default NotificationHistoryItem;
