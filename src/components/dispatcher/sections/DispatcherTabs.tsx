import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface DispatcherTabsProps {
    activeTab: 'dispatched' | 'pending';
    onTabChange: (tab: 'dispatched' | 'pending') => void;
}

const DispatcherTabs: React.FC<DispatcherTabsProps> = ({ activeTab, onTabChange }) => {
    return (
        <View className="flex-row">
            <TouchableOpacity
                onPress={() => onTabChange('dispatched')}
                className="flex-1 py-4 items-center"
                style={{
                    borderBottomWidth: 4,
                    borderBottomColor: activeTab === 'dispatched' ? '#222222' : '#E8E8E8',
                }}
            >
                <Text className={`text-[16px] ${activeTab === 'dispatched' ? 'text-[#222222] font-inter-bold' : 'text-[#9A9A9A] font-inter-medium'}`}>
                    Dispatched
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => onTabChange('pending')}
                className="flex-1 py-4 items-center"
                style={{
                    borderBottomWidth: 4,
                    borderBottomColor: activeTab === 'pending' ? '#222222' : '#E8E8E8',
                }}
            >
                <Text className={`text-[16px] ${activeTab === 'pending' ? 'text-[#222222] font-inter-bold' : 'text-[#9A9A9A] font-inter-medium'}`}>
                    Not Dispatched
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default DispatcherTabs;
