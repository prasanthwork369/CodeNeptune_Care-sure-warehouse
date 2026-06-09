import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { WarehouseStat } from '@/src/types/home';
import { icons } from '@/src/constants/icons';



interface StatsCardProps extends WarehouseStat {
    onPress?: () => void;
}

const StatsCard = ({
    title,
    badge,
    value,
    label,
    itemsPerHr,
    activeHours,
    totalItems,
    gradient,
    illustration,
    onPress,
}: StatsCardProps) => {
    const illustrationSource = illustration === 'picks'
        ? require('@/assets/images/picks_tool.png')
        : illustration === 'dispatch'
        ? require('@/assets/images/Dispatch.png')
        : require('@/assets/images/packs_box.png');

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            className="mb-2 mt-4 shadow-xl shadow-black/10"
            style={{ borderRadius: 24 }}
        >
            {badge && (
                <View
                    className="absolute -top-9 right-4 z-10 px-5 py-1.5 flex-row items-center rounded-t-[10px] bg-brand-primary"
                >
                    <MaterialCommunityIcons name="flag" size={14} color="white" />
                    <Text className="text-white text-[12px] ml-1.5 tracking-tight font-inter-bold">{badge}</Text>
                </View>
            )}

            <LinearGradient
                colors={gradient}
                style={{ borderRadius: 10 }}
                className="p-7 overflow-hidden min-h-[200px]"
            >
                {/* Decorative Circles backdrop - Perfectly Concentric for exact match */}
                <View
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                    className="absolute -right-[70px] -bottom-[70px] w-[300px] h-[300px] rounded-full"
                />
                <View
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    className="absolute -right-[20px] -bottom-[20px] w-[200px] h-[200px] rounded-full"
                />
                <View
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                    className="absolute right-[10px] bottom-[10px] w-[140px] h-[140px] rounded-full"
                />

                <View className="flex-1 justify-between relative z-10">
                    <View>
                        <Text className="text-white text-2xl tracking-tight opacity-95 font-inter-bold">{title}</Text>
                    </View>

                    <View className="mt-8 mb-4">
                        <View className="flex-row items-baseline">
                            <Text className="text-[#FFFFFF] text-6xl font-inter-medium">{value}</Text>
                            <Text className="text-[#FFFFFF] text-2xl font-inter-medium ml-2.5">{label}</Text>
                        </View>
                    </View>

                    <View className="gap-y-1.5">
                        {itemsPerHr > 0 && (
                            <View className="flex-row items-center">
                                <icons.clock_loader width={15} height={15} fill="#FFFFFF" />
                                <Text className="text-[#FFFFFF] text-[13px] font-inter-medium ml-2">
                                    {itemsPerHr} items/hr • {activeHours}h active
                                </Text>
                            </View>
                        )}
                        <View className="flex-row items-center">
                            <icons.pill width={16} height={16} fill="#FFFFFF" />
                            <Text className="text-white/90 text-[13px] font-inter-medium ml-2">
                                {totalItems} Items
                            </Text>
                        </View>
                    </View>
                </View>
                <Image
                    source={illustrationSource}
                    className={`absolute ${illustration === 'dispatch' ? 'right-6 bottom-2 w-48 h-48' : 'right-0 bottom-0 w-40 h-40'}`}
                    resizeMode="contain"
                />
            </LinearGradient>
        </TouchableOpacity>
    );
};


export default React.memo(StatsCard);
