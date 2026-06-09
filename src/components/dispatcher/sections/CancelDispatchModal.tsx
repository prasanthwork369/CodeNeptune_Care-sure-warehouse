import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { icons } from '@/src/constants/icons';
import { colors } from '@/src/theme/colors';

interface CancelDispatchModalProps {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const CancelDispatchModal: React.FC<CancelDispatchModalProps> = ({ isVisible, onClose, onConfirm }) => {
    const DispatchIcon = icons.local_shipping;

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View className="flex-1 bg-black/40 justify-center items-center px-6">
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <View className="bg-white w-full rounded-[28px] overflow-hidden">
                    {/* Icon + Message */}
                    <View className="items-center pt-10 pb-8 px-8">
                        <View
                            className="w-[110px] h-[110px] rounded-full items-center justify-center mb-6"
                            style={{ backgroundColor: '#EFD8D8' }}
                        >
                            <DispatchIcon width={60} height={60} fill="#C0392B" />
                        </View>

                        <Text className="text-[22px] font-inter-semibold text-[#222222] text-center leading-8">
                            Are you sure you want to{'\n'}cancel dispatch?
                        </Text>
                    </View>

                    {/* Buttons */}
                    <View className="flex-row px-4 pb-8 gap-4">
                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.8}
                            className="flex-1 py-5 rounded-[16px] items-center"
                            style={{ backgroundColor: '#E8E8E8' }}
                        >
                            <Text className="text-[18px] font-inter-bold text-[#222222]">No</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onConfirm}
                            activeOpacity={0.8}
                            className="flex-1 py-5 rounded-[16px] items-center"
                            style={{ backgroundColor: colors.brand.primary }}
                        >
                            <Text className="text-[18px] font-inter-bold text-white">Yes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default CancelDispatchModal;
