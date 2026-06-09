import { colors } from '@/src/constants/theme';
import React from 'react';
import { View } from 'react-native';

// Updated to accept SVG component type
interface TabIconProps {
    icon: React.ComponentType<{ fill?: string; width?: number; height?: number }>;
    color: string;
    focused: boolean;
}

const TabIcon = ({ icon: Icon, color, focused }: TabIconProps) => {
    return (
        <View className="items-center justify-center mt-4">
            <Icon
                width={24}
                height={24}
                fill={focused ? colors.white : color}
            />
        </View>
    );
};

export default TabIcon;
