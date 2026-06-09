import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';

interface EditOptionsModalProps {
    isVisible: boolean;
    onClose: () => void;
    onPartialPress: () => void;
    onBatchPress: () => void;
}

const EditOptionsModal: React.FC<EditOptionsModalProps> = ({
    isVisible,
    onClose,
    onPartialPress,
    onBatchPress
}) => {
    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable 
                style={StyleSheet.absoluteFill} 
                className="bg-black/20" 
                onPress={onClose} 
            />
            <View className="flex-1 justify-center items-center px-10">
                <View className="bg-white w-full rounded-[24px] overflow-hidden shadow-xl">
                    <TouchableOpacity 
                        activeOpacity={0.7}
                        onPress={() => {
                            onClose();
                            onPartialPress();
                        }}
                        className="py-5 px-6 border-b border-[#F5F5F5] flex-row items-center"
                    >
                        <Text className="text-[17px] font-inter-medium text-[#222222]">Partial</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        activeOpacity={0.7}
                        onPress={() => {
                            onClose();
                            onBatchPress();
                        }}
                        className="py-5 px-6 flex-row items-center"
                    >
                        <Text className="text-[17px] font-inter-medium text-[#222222]">Batch</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default EditOptionsModal;
