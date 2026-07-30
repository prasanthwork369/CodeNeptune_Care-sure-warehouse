import React from 'react';
import { Text, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/useAuthStore';
import { USER_DATA } from '@/src/constants/data';
import { useRouter } from 'expo-router';

const DashboardHeader = () => {
    const router = useRouter();
    const { user } = useAuthStore();
    const displayName = user?.profile?.firstName || user?.email?.split('@')[0] || 'Picker';

    return (
        <View className="flex-row items-center justify-between mb-8 mt-6">
            <View className="flex-row items-center">
                <TouchableOpacity
                    onPress={() => router.push('/profile')}
                    activeOpacity={0.7}
                    className="w-20 h-20 rounded-full overflow-hidden mr-3 border-2 border-white shadow-sm bg-gray-100"
                >
                    {user?.profile?.avatarUrl ? (
                        <Image
                            source={{ uri: user.profile.avatarUrl }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full items-center justify-center bg-brand-primary">
                            <Text className="text-white font-inter-bold text-2xl">
                                {displayName[0]?.toUpperCase()}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
                <View>
                    <Text className="text-[28px] text-[#1A1A1A] leading-tight font-inter-bold tracking-tight">
                        Welcome, {user ? displayName : '...'}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={() => router.push('/notifications')}
                activeOpacity={0.7}
                className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-sm border border-black/5"
            >
                <Ionicons name="notifications" size={26} color="#1A1A1A" />
            </TouchableOpacity>
        </View>
    );
};

export default DashboardHeader;
