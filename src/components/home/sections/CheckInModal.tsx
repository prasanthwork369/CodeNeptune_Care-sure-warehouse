import React, { useEffect, useState, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/useAuthStore';

const CHECKIN_KEY = 'checkin_date';

const getTodayKey = () => new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

const CheckInModal: React.FC = () => {
    const { user } = useAuthStore();
    const displayName = user?.profile?.firstName || user?.email?.split('@')[0] || 'there';

    const [visible, setVisible] = useState(false);
    const [entryTime] = useState(formatTime(new Date()));
    const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            // Check permission FIRST so the notification row never flashes when already granted
            const { status } = await Notifications.getPermissionsAsync();
            if (status === 'granted') setNotifStatus('granted');

            const stored = await AsyncStorage.getItem(CHECKIN_KEY);
            if (stored !== getTodayKey()) {
                setVisible(true);
            }
        })();
    }, []);

    const handleAllowNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            setNotifStatus(status === 'granted' ? 'granted' : 'denied');

            if (status === 'granted') {
                if (Platform.OS === 'android') {
                    await Notifications.setNotificationChannelAsync('default', {
                        name: 'default',
                        importance: Notifications.AndroidImportance.MAX,
                        vibrationPattern: [0, 250, 250, 250],
                        lightColor: '#1A1A1A',
                    });
                }
                // Register for push token now that permission is granted
                const { pushNotificationService } = require('@/src/services/pushNotification.service');
                const token = await pushNotificationService.registerForPushAsync();
                if (token && __DEV__) console.log('📲 Expo Push Token:', token);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const handleConfirm = useCallback(async () => {
        await AsyncStorage.setItem(CHECKIN_KEY, getTodayKey());
        setVisible(false);
    }, []);

    if (!visible) return null;

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            statusBarTranslucent
            onRequestClose={handleConfirm}
        >
            <View className="flex-1 bg-black/50 items-center justify-center px-5">
                <View className="w-full bg-white rounded-3xl overflow-hidden">
                    {/* Header */}
                    <View className="bg-brand-primary px-6 pt-7 pb-6">
                        <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center mb-4">
                            <Ionicons name="time-outline" size={30} color="#fff" />
                        </View>
                        <Text className="text-white text-2xl font-inter-bold">Good morning, {displayName}!</Text>
                        <Text className="text-white/80 text-sm font-inter-medium mt-1">
                            Your shift entry has been recorded.
                        </Text>
                    </View>

                    <View className="px-6 py-6 gap-y-5">
                        {/* Entry time row */}
                        <View className="flex-row items-center bg-[#F2F2F2] rounded-2xl px-4 py-4 gap-x-3">
                            <View className="w-10 h-10 bg-brand-primary/10 rounded-xl items-center justify-center">
                                <Ionicons name="checkmark-circle" size={22} color="#0F7635" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-[#6A6A6A] text-xs font-inter-medium uppercase tracking-widest">
                                    Entry Time
                                </Text>
                                <Text className="text-[#1A1A1A] text-xl font-inter-bold mt-0.5">
                                    {entryTime}
                                </Text>
                            </View>
                        </View>

                        {/* Notification permission row */}
                        {notifStatus !== 'granted' && (
                            <View className="rounded-2xl border border-[#E6E6E6] px-4 py-4">
                                <Text className="text-[#1A1A1A] font-inter-semibold text-sm mb-1">
                                    Enable Notifications
                                </Text>
                                <Text className="text-[#6A6A6A] text-xs font-inter-regular mb-3 leading-relaxed">
                                    Allow Caresure Warehouse to send you order alerts and updates.
                                </Text>
                                <TouchableOpacity
                                    onPress={handleAllowNotifications}
                                    activeOpacity={0.8}
                                    disabled={loading || notifStatus === 'denied'}
                                    className={`flex-row items-center justify-center rounded-xl py-3 gap-x-2 ${
                                        notifStatus === 'denied'
                                            ? 'bg-[#F2F2F2]'
                                            : 'bg-brand-primary'
                                    }`}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons
                                                name={notifStatus === 'denied' ? 'notifications-off-outline' : 'notifications-outline'}
                                                size={18}
                                                color={notifStatus === 'denied' ? '#969696' : '#fff'}
                                            />
                                            <Text
                                                className={`font-inter-semibold text-sm ${
                                                    notifStatus === 'denied' ? 'text-[#969696]' : 'text-white'
                                                }`}
                                            >
                                                {notifStatus === 'denied' ? 'Permission Denied' : 'Allow Notifications'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {notifStatus === 'granted' && (
                            <View className="flex-row items-center gap-x-2 px-1">
                                <Ionicons name="checkmark-circle" size={18} color="#0F7635" />
                                <Text className="text-[#0F7635] font-inter-medium text-sm">
                                    Notifications enabled
                                </Text>
                            </View>
                        )}

                        {/* Confirm button */}
                        <TouchableOpacity
                            onPress={handleConfirm}
                            activeOpacity={0.85}
                            className="bg-brand-primary rounded-2xl py-4 items-center"
                        >
                            <Text className="text-white font-inter-bold text-base">
                                Start My Shift
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default CheckInModal;
