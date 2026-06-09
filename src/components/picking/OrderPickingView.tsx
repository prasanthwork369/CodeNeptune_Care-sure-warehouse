import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Order, OrderItem, BatchRow } from '@/src/types/order.types';
import { orderService } from '@/src/services/order.service';
import { useFulfillmentActions } from '@/src/hooks/useFulfillment';
import { fulfillmentApi } from '@/src/api/fulfillment.api';
import { useQueryClient } from '@tanstack/react-query';
import { ExtendMinutes } from '@/src/types/fulfillment.types';
import OrderItemCard from './OrderItemCard';
import PickingProgressFooter from './PickingProgressFooter';
import ConfirmMoveBottomSheet from './ConfirmMoveBottomSheet';
import PartialQuantityModal from './PartialQuantityModal';
import BatchSelectionModal from './BatchSelectionModal';
import SessionExpirySheet from './SessionExpirySheet';
import OrderInfoPopup from './OrderInfoPopup';
import QRCodeModal from './QRCodeModal';
import BackButton from '@/src/components/common/BackButton';
import { useOrderStore } from '@/src/store/useOrderStore';
import { icons } from '@/src/constants/icons';
import colors from '@/src/theme/colors';
import { ItemPickingSkeletonList } from './ItemPickingSkeleton';

interface OrderPickingViewProps {
    orderId: string;
    expiresAt?: string;
    displayOrderId?: string;
}


const OrderPickingView: React.FC<OrderPickingViewProps> = ({ orderId, expiresAt, displayOrderId }) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [order, setOrder] = useState<Order | null>(null);
    const [pickingItems, setPickingItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isConfirmSheetVisible, setConfirmSheetVisible] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [isPartialModalVisible, setPartialModalVisible] = useState(false);
    const [isBatchModalVisible, setBatchModalVisible] = useState(false);
    const [isInfoSheetVisible, setInfoSheetVisible] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(0);
    const [footerHeight, setFooterHeight] = useState(0);
    const [isExpirySheetVisible, setExpirySheetVisible] = useState(false);
    const [isQRModalVisible, setQRModalVisible] = useState(false);
    const expiryAlertShownRef = useRef(false);
    const isFocusedRef = useRef(false);
    const [activeItemForEdit, setActiveItemForEdit] = useState<OrderItem | null>(null);
    const [itemBatches, setItemBatches] = useState<Record<string, BatchRow[]>>({});
    const activeItemRef = useRef<OrderItem | null>(null);
    const { setActiveTab } = useOrderStore();
    const { claim, release, extend, isExtending } = useFulfillmentActions(orderId);

    // Track focus state so the expiry sheet only triggers when this screen is visible
    useFocusEffect(useCallback(() => {
        isFocusedRef.current = true;
        return () => {
            isFocusedRef.current = false;
            setExpirySheetVisible(false);
            setConfirmSheetVisible(false);
        };
    }, []));

    // ── Claim on mount if no lock was passed (optimistic navigation) ──────────
    useEffect(() => {
        if (!expiresAt) {
            claim(orderId)
                .then(lock => setLockExpiresAt(lock.expiresAt))
                .catch(() => router.back());
        }
    }, []);

    // ── Lock countdown timer ───────────────────────────────────────────────
    const [lockExpiresAt, setLockExpiresAt] = useState(expiresAt);
    const [secondsLeft, setSecondsLeft] = useState(() =>
        expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0
    );

    useEffect(() => {
        if (!lockExpiresAt) return;
        // Set immediately so timer shows without waiting for first tick
        setSecondsLeft(Math.max(0, Math.floor((new Date(lockExpiresAt).getTime() - Date.now()) / 1000)));
        const interval = setInterval(() => {
            setSecondsLeft(Math.max(0, Math.floor((new Date(lockExpiresAt).getTime() - Date.now()) / 1000)));
        }, 1000);
        return () => clearInterval(interval);
    }, [lockExpiresAt]);

    // Auto-show expiry warning sheet at 2 minutes remaining
    // Suppressed while moving to packer or when screen is not in focus
    // Auto-release when timer reaches 0 with no user response
    useEffect(() => {
        if (isMoving || !isFocusedRef.current) {
            setExpirySheetVisible(false);
            return;
        }
        if (secondsLeft > 120) {
            expiryAlertShownRef.current = false;
        } else if (secondsLeft <= 120 && secondsLeft > 0 && !expiryAlertShownRef.current) {
            expiryAlertShownRef.current = true;
            setExpirySheetVisible(true);
        } else if (secondsLeft === 0 && lockExpiresAt) {
            // Lock expired — release and navigate back automatically
            setExpirySheetVisible(false);
            release().catch(() => {});
            setActiveTab('new');
            router.back();
        }
    }, [secondsLeft, isMoving]);


    const handleExtend = async (minutes: ExtendMinutes) => {
        try {
            const newLock = await extend(minutes);
            if (newLock) {
                setLockExpiresAt(newLock.expiresAt);
                setExpirySheetVisible(false);
            }
        } catch {
            // Lock expired or lost — go back, error notification handled in useFulfillmentActions
            setExpirySheetVisible(false);
            router.back();
        }
    };


    const handleBack = useCallback(() => {
        release().catch(() => { /* lock expires naturally */ });
        router.back();
    }, [orderId]);

    // Android hardware back button
    useEffect(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            handleBack();
            return true;
        });
        return () => sub.remove();
    }, [handleBack]);
    const Information = icons.info;
    const Print = icons.print;

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    const loadOrder = async () => {
        try {
            const data = await orderService.getById(orderId);
            if (data) {
                setOrder(data);
                setPickingItems(data.pickingItems || []);
            }
        } catch (error) {
            if (__DEV__) console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = (id: string, newStatus: 'pending' | 'partial' | 'completed') => {
        setPickingItems(prev => prev.map(item => {
            if (item.id === id) {
                const pickedQty = newStatus === 'completed' ? item.requiredQty : 0;
                return { ...item, status: newStatus, pickedQty };
            }
            return item;
        }));
        if (newStatus === 'pending') {
            setItemBatches(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    };

    const handlePartialConfirm = (quantity: number) => {
        const target = activeItemRef.current;
        if (target) {
            setPickingItems(prev => prev.map(i => {
                if (i.id === target.id) {
                    const newStatus = quantity >= i.requiredQty ? 'completed' : 'partial';
                    return { ...i, status: newStatus, pickedQty: quantity };
                }
                return i;
            }));
        }
        // Always close modal and clean up regardless of ref state
        setPartialModalVisible(false);
        setActiveItemForEdit(null);
        activeItemRef.current = null;
    };

    const handleBatchSave = (batches: BatchRow[]) => {
        const target = activeItemRef.current;
        if (target) {
            setItemBatches(prev => ({ ...prev, [target.id]: batches }));
            const totalPicked = batches.reduce((sum, b) => sum + (parseInt(b.quantity) || 0), 0);
            setPickingItems(prev => prev.map(i => {
                if (i.id === target.id) {
                    return { ...i, pickedQty: totalPicked, status: totalPicked >= i.requiredQty ? 'completed' : 'partial' };
                }
                return i;
            }));
        }
        setBatchModalVisible(false);
        setActiveItemForEdit(null);
        activeItemRef.current = null;
    };

    const pickedCount = pickingItems.filter(item => item.status === 'completed').length;
    const isAnyPartial = pickingItems.some(item => item.status === 'partial');
    const isAllHandled = pickingItems.length > 0 &&
        pickingItems.every(item => item.status === 'completed' || item.status === 'partial' || !!itemBatches[item.id]);

    const handleMovePartial = async () => {
        const items = pickingItems.map(item => ({
            orderItemId: item.id,
            pickedQuantity: item.pickedQty ?? 0,
        }));
        await fulfillmentApi.pick(orderId, items);
    };

    const handleMoveToPacker = async () => {
        const items = pickingItems.map(item => ({
            orderItemId: item.id,
            pickedQuantity: item.pickedQty ?? item.requiredQty,
        }));
        await fulfillmentApi.pick(orderId, items);
    };

    const handleConfirmMove = async () => {
        if (isMoving) return;
        setIsMoving(true);
        try {
            if (isAnyPartial) {
                await handleMovePartial();
            } else {
                await handleMoveToPacker();
            }
            setLockExpiresAt(undefined);
            setConfirmSheetVisible(false);
            setActiveTab('new');
            queryClient.invalidateQueries({ queryKey: ['home-stats'] });
            router.back();
        } catch {
            // Lock lost or API error — notification handled in fulfillmentApi, stay on screen
        } finally {
            setIsMoving(false);
        }
    };

    const insets = useSafeAreaInsets();

    return (
        <View className="flex-1 bg-white">
            {/* Custom Header */}
            <View
                style={{ paddingTop: (insets.top || 20), zIndex: 20 }}
                className="px-5 pb-4 flex-row items-center bg-white border-b border-[#F0F0F0]"
                onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
            >
                <BackButton onPress={handleBack} />

                <View className="flex-1 ml-1">
                    <Text 
                        style={{ color: colors.text.DEFAULT }} 
                        className="text-[19px] font-inter-bold"
                        numberOfLines={1}
                    >
                        Order #{order?.orderId || displayOrderId || '...'}
                    </Text>
                    <Text style={{ color: '#6A6A6A' }} className="text-[13px] font-inter-medium mt-0.5">
                        {loading ? 'Loading...' : `${pickingItems.length} Medicines`}
                    </Text>
                </View>

                <View className="flex-row items-center">
                    {/* Countdown badge — visible in last 2 minutes */}
                    {secondsLeft > 0 && secondsLeft <= 120 && (
                        <TouchableOpacity
                            onPress={() => setExpirySheetVisible(true)}
                            activeOpacity={0.8}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: secondsLeft <= 30 ? '#FEE2E2' : '#FEF3C7',
                                borderRadius: 20,
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                marginRight: 4,
                            }}
                        >
                            <Text style={{
                                fontSize: 13,
                                fontFamily: 'Inter_700Bold',
                                color: secondsLeft <= 30 ? '#DC2626' : '#D97706',
                            }}>
                                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Info button */}
                    <TouchableOpacity
                        onPress={() => setInfoSheetVisible(prev => !prev)}
                        className="p-2"
                    >
                        <Information
                            width={28}
                            height={28}
                            fill={isInfoSheetVisible ? colors.brand.primary : colors.text.DEFAULT}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="p-2"
                        onPress={() => setQRModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Print width={28} height={28} fill={colors.text.DEFAULT} />
                    </TouchableOpacity>
                </View>
            </View>


            {loading ? (
                <View style={{ backgroundColor: colors.surface.main }} className="flex-1">
                    <ItemPickingSkeletonList />
                </View>
            ) : !order ? (
                <View className="flex-1 justify-center items-center bg-white">
                    <Text>Order not found</Text>
                </View>
            ) : (
                <ScrollView
                    style={{ backgroundColor: colors.surface.main }}
                    className="flex-1 px-5 pt-4"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: footerHeight + 16 }}
                >
                    {pickingItems.map(item => (
                        <OrderItemCard
                            key={item.id}
                            item={item}
                            batches={itemBatches[item.id]}
                            onToggleStatus={handleToggleStatus}
                            onPartialPress={(item) => {
                                activeItemRef.current = item;
                                setActiveItemForEdit(item);
                                setPartialModalVisible(true);
                            }}
                            onBatchPress={(item) => {
                                activeItemRef.current = item;
                                setActiveItemForEdit(item);
                                setBatchModalVisible(true);
                            }}
                        />
                    ))}
                </ScrollView>
            )}

            {/* Progress Footer */}
            {!loading && order && (
                <View onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
                    <PickingProgressFooter
                        totalItems={pickingItems.length}
                        pickedItems={pickedCount}
                        isAnyPartial={isAnyPartial}
                        isAllHandled={isAllHandled}
                        onMainPress={() => setConfirmSheetVisible(true)}
                    />
                </View>
            )}

            {/* Order Info Popup */}
            <OrderInfoPopup
                isVisible={isInfoSheetVisible}
                onClose={() => setInfoSheetVisible(false)}
                topOffset={headerHeight}
                order={order}
            />

            {/* Session Expiry Warning Sheet */}
            <SessionExpirySheet
                isVisible={isExpirySheetVisible}
                onClose={() => setExpirySheetVisible(false)}
                onExtend={handleExtend}
                secondsLeft={secondsLeft}
                isExtending={isExtending}
            />

            {/* Finalize Confirmation Sheet */}
            <ConfirmMoveBottomSheet
                isVisible={isConfirmSheetVisible}
                onClose={() => { if (!isMoving) setConfirmSheetVisible(false); }}
                onConfirm={handleConfirmMove}
                type={isAnyPartial ? 'partial' : 'packer'}
                isLoading={isMoving}
                message={isAnyPartial
                    ? "Are you sure you want to move this order to partial?"
                    : "Are you sure you want to move this order to packing?"
                }
            />

            {/* Partial Quantity Modal */}
            <PartialQuantityModal
                isVisible={isPartialModalVisible}
                item={activeItemForEdit}
                onClose={() => {
                    setPartialModalVisible(false);
                    setActiveItemForEdit(null);
                }}
                onConfirm={handlePartialConfirm}
            />

            {/* Batch Selection Modal */}
            <BatchSelectionModal
                isVisible={isBatchModalVisible}
                item={activeItemForEdit}
                initialBatches={activeItemForEdit ? itemBatches[activeItemForEdit.id] : undefined}
                onClose={() => {
                    setBatchModalVisible(false);
                    setActiveItemForEdit(null);
                    activeItemRef.current = null;
                }}
                onSave={handleBatchSave}
            />

            {/* QR Code Modal */}
            <QRCodeModal
                visible={isQRModalVisible}
                orderId={order?.orderId || displayOrderId || orderId}
                onClose={() => setQRModalVisible(false)}
            />

        </View>
    );
};

export default OrderPickingView;
