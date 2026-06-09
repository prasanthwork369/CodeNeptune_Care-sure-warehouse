import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, Modal, Pressable,
    StyleSheet, ScrollView, TextInput, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { OrderItem, BatchRow } from '@/src/types/order.types';
import { inventoryApi, InventoryBatch } from '@/src/api/inventory.api';
import { formatExpiryDate } from '@/src/utils/dateUtils';

interface BatchSelectionModalProps {
    isVisible: boolean;
    item: OrderItem | null;
    initialBatches?: BatchRow[];
    onClose: () => void;
    onSave: (batches: BatchRow[]) => void;
}

const BatchSelectionModal: React.FC<BatchSelectionModalProps> = ({
    isVisible,
    item,
    initialBatches,
    onClose,
    onSave,
}) => {
    const [batches, setBatches] = useState<BatchRow[]>([
        { id: '1', batchNo: '', quantity: '' }
    ]);
    const [availableBatches, setAvailableBatches] = useState<InventoryBatch[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    useEffect(() => {
        if (!isVisible) {
            setOpenDropdownId(null);
            return;
        }

        if (initialBatches && initialBatches.length > 0) {
            setBatches(initialBatches);
        } else if (item) {
            setBatches([{ id: '1', batchNo: item.batchNo || '', quantity: item.requiredQty.toString() }]);
        }

        if (item?.medicineId) {
            setLoadingBatches(true);
            inventoryApi.getBatches(item.medicineId)
                .then(data => setAvailableBatches(data))
                .catch(() => setAvailableBatches([]))
                .finally(() => setLoadingBatches(false));
        } else {
            setAvailableBatches([]);
        }
    }, [isVisible]);

    const addBatch = useCallback(() => {
        setBatches(prev => [
            ...prev,
            { id: Date.now().toString(), batchNo: '', quantity: '' },
        ]);
    }, []);

    const updateBatch = (id: string, field: keyof BatchRow, value: string) => {
        setBatches(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const selectBatch = (rowId: string, batch: InventoryBatch) => {
        setBatches(prev => prev.map(b =>
            b.id === rowId
                ? { ...b, batchNo: batch.batchNumber, quantity: b.quantity || batch.quantity.toString() }
                : b
        ));
        setOpenDropdownId(null);
    };

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <Pressable onPress={() => {}} style={{ backgroundColor: '#fff', width: '100%', borderRadius: 28, padding: 24 }}>
                    {/* Ordered Units */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text style={{ color: colors.text.DEFAULT, fontSize: 17, fontFamily: 'Inter_700Bold' }}>
                            Ordered Units
                        </Text>
                        <View style={{ backgroundColor: '#F2F2F2', width: 72, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#666666', fontSize: 26, fontFamily: 'Inter_700Bold' }}>
                                {item?.requiredQty ?? 0}
                            </Text>
                        </View>
                    </View>

                    {/* Batch Number label */}
                    <Text style={{ color: colors.text.DEFAULT, fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 12 }}>
                        Batch Number
                    </Text>

                    {loadingBatches && (
                        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                            <ActivityIndicator color={colors.brand.primary} />
                        </View>
                    )}

                    {/* Batch Rows */}
                    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 260 }}>
                        {batches.map((batch) => (
                            <View key={batch.id}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    {/* Batch Dropdown Trigger */}
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            height: 54,
                                            borderWidth: 1.5,
                                            borderColor: openDropdownId === batch.id ? colors.brand.primary : '#E0E0E0',
                                            borderRadius: 12,
                                            paddingHorizontal: 14,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginRight: 12,
                                            backgroundColor: '#fff',
                                        }}
                                        onPress={() => setOpenDropdownId(prev => prev === batch.id ? null : batch.id)}
                                    >
                                        <Text style={{
                                            fontSize: 15,
                                            fontFamily: 'Inter_600SemiBold',
                                            color: batch.batchNo ? colors.text.DEFAULT : '#BBBBBB',
                                            flex: 1,
                                        }}>
                                            {batch.batchNo || 'Select batch'}
                                        </Text>
                                        <Ionicons
                                            name={openDropdownId === batch.id ? 'caret-up' : 'caret-down'}
                                            size={13}
                                            color={openDropdownId === batch.id ? colors.brand.primary : colors.text.DEFAULT}
                                        />
                                    </TouchableOpacity>

                                    {/* Quantity */}
                                    <TextInput
                                        style={{
                                            width: 68,
                                            height: 54,
                                            borderWidth: 1.5,
                                            borderColor: colors.text.DEFAULT,
                                            borderRadius: 12,
                                            fontSize: 24,
                                            fontFamily: 'Inter_700Bold',
                                            textAlign: 'center',
                                            color: colors.text.DEFAULT,
                                        }}
                                        value={batch.quantity}
                                        onChangeText={(val) => updateBatch(batch.id, 'quantity', val.replace(/[^0-9]/g, ''))}
                                        keyboardType="numeric"
                                        maxLength={4}
                                        placeholder="0"
                                        placeholderTextColor="#BBBBBB"
                                    />
                                </View>

                                {/* Dropdown Options */}
                                {openDropdownId === batch.id && (
                                    <View style={{
                                        marginRight: 80,
                                        marginBottom: 8,
                                        borderWidth: 1.5,
                                        borderColor: '#E0E0E0',
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                        backgroundColor: '#fff',
                                    }}>
                                        {availableBatches.length === 0 ? (
                                            <View style={{ padding: 14 }}>
                                                <Text style={{ color: colors.text.muted, fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
                                                    {loadingBatches ? 'Loading...' : 'No batches available'}
                                                </Text>
                                            </View>
                                        ) : (
                                            availableBatches.map((b, index) => (
                                                <TouchableOpacity
                                                    key={b.id}
                                                    onPress={() => selectBatch(batch.id, b)}
                                                    style={{
                                                        paddingHorizontal: 14,
                                                        paddingVertical: 12,
                                                        borderBottomWidth: index < availableBatches.length - 1 ? 1 : 0,
                                                        borderBottomColor: '#F0F0F0',
                                                        backgroundColor: batch.batchNo === b.batchNumber ? colors.brand.primarySoft : '#fff',
                                                    }}
                                                >
                                                    <Text style={{
                                                        fontSize: 14,
                                                        fontFamily: batch.batchNo === b.batchNumber ? 'Inter_600SemiBold' : 'Inter_400Regular',
                                                        color: colors.text.DEFAULT,
                                                    }}>
                                                        {b.batchNumber}
                                                    </Text>
                                                    {b.expiryDate && (
                                                        <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginTop: 2 }}>
                                                            EXP {formatExpiryDate(b.expiryDate)} · Qty: {b.quantity}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>

                    {/* Add Batch */}
                    <TouchableOpacity onPress={addBatch} style={{ marginTop: 4, marginBottom: 24 }}>
                        <Text style={{ color: colors.text.blue, fontSize: 15, fontFamily: 'Inter_700Bold' }}>
                            + Add Batch
                        </Text>
                    </TouchableOpacity>

                    {/* Save */}
                    <TouchableOpacity
                        onPress={() => onSave(batches)}
                        className='rounded-md'
                        style={{ backgroundColor: colors.brand.primary, paddingVertical: 18, alignItems: 'center' }}
                    >
                        <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' }}>
                            Save
                        </Text>
                    </TouchableOpacity>
                </Pressable>
            </View>
        </Modal>
    );
};

export default BatchSelectionModal;
