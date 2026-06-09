import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNotificationStore } from '@/src/store/useNotificationStore';
import NotificationHistoryItem from '@/src/components/notifications/NotificationHistoryItem';

const NotificationsScreen = () => {
    const router = useRouter();
    const { history, clearHistory } = useNotificationStore();

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: '#F8F9FA' }}>
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-black/5 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-gray-50">
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text className="text-[18px] font-inter-bold text-[#1A1A1A]">Notifications</Text>
                
                <View className="flex-row items-center">
                    {history.length > 0 && (
                        <TouchableOpacity onPress={clearHistory} className="p-2">
                            <Text className="text-sm font-inter-semibold text-red-500">Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
                showsVerticalScrollIndicator={false}
            >
                {history.length === 0 ? (
                    <View className="items-center justify-center mt-32 opacity-30">
                        <MaterialCommunityIcons name="bell-off-outline" size={80} color="#1A1A1A" />
                        <Text className="mt-4 font-inter-bold text-xl text-[#1A1A1A]">No notifications</Text>
                        <Text className="mt-2 font-inter-medium text-gray-500 text-center px-10">
                            Your order updates and alerts will appear here.
                        </Text>
                    </View>
                ) : (
                    history.map((notification) => (
                        <NotificationHistoryItem 
                            key={notification.id} 
                            notification={notification} 
                        />
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default NotificationsScreen;
