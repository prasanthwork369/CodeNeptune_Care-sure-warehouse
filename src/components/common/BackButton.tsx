import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { icons } from '@/src/constants/icons';
import { colors } from '@/src/theme/colors';

interface BackButtonProps {
    onPress?: () => void;
    color?: string;
}

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

const BackButton: React.FC<BackButtonProps> = ({ onPress, color }) => {
    const router = useRouter();
    const ArrowBack = icons.arrowBack;

    return (
        <TouchableOpacity
            onPress={onPress ?? (() => router.back())}
            hitSlop={HIT_SLOP}
            activeOpacity={0.6}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 }}
        >
            <ArrowBack width={20} height={20} fill={color ?? colors.text.DEFAULT} />
        </TouchableOpacity>
    );
};

export default BackButton;
