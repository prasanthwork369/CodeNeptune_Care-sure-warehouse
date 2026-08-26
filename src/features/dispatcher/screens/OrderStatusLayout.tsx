import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import AppLoader from "@/src/components/common/AppLoader";
import ErrorModal from "@/src/components/common/ErrorModal";
import BackButton from "@/src/components/common/BackButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dispatcherApi } from "@/src/features/dispatcher/api/dispatcher.api";
import { orderApi } from "@/src/features/picker/api/order.api";
import { mapOrder } from "@/src/features/picker/services/order.service";
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  OrderStatusValue,
} from "@/src/features/picker/constants/order.constants";
import { icons } from "@/src/constants/icons";
import { colors } from "@/src/theme/colors";
import { formatOrderDate } from "@/src/utils/dateUtils";
import CancelDispatchModal from '../components/CancelDispatchModal';

export interface OrderStatusLayoutProps {
  orderId?: string;
}

export const OrderStatusLayout: React.FC<OrderStatusLayoutProps> = ({ orderId: propOrderId }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { orderId: paramOrderId } = useLocalSearchParams<{ orderId: string }>();
  const orderId = propOrderId || paramOrderId;

  const [showCancelModal, setShowCancelModal] = useState(false);

  const Success = icons.success;
  const Cancel = icons.cancel;
  const Person = icons.person;
  const CalendarToday = icons.calendar_today;

  // ── Fetch order ─────────────────────────────────────────────────────────
  const {
    data: apiOrder,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dispatcher-order", orderId],
    queryFn: () => dispatcherApi.getOrderForDispatch(orderId!),
    enabled: !!orderId,
    staleTime: 0,
    gcTime: 0,
    retry: 1,
  });

  const order = apiOrder ? mapOrder(apiOrder) : null;
  const rawStatus = Number(apiOrder?.status);
  const isReady = rawStatus === ORDER_STATUS.PACKED

  const isCancelled =
    rawStatus === ORDER_STATUS.CANCELLED ||
    rawStatus === ORDER_STATUS.DISPATCHER_CANCEL

  const cancelledAt = (apiOrder as any)?.cancelledAt
    ? formatOrderDate((apiOrder as any).cancelledAt)
    : null;

  useEffect(() => {
    if (apiOrder) {
      console.log("📋 [OrderStatusLayout] Order loaded:", {
        id: apiOrder.id,
        orderId: apiOrder.orderId,
        status: apiOrder.status,
        rawStatus,
        isReady,
        isCancelled,
        customerName: order?.customerName || "N/A",
      });
    }
  }, [apiOrder, rawStatus, isReady, isCancelled, order?.customerName]);

  // ── Dispatch ─────────────────────────────────────────────────────────────
  const { mutateAsync: doDispatch, isPending: isDispatching } = useMutation({
    mutationFn: async () => {
      await dispatcherApi.dispatch(apiOrder!.id);
      await orderApi.updateStatus(
        apiOrder!.id,
        7,
        "Auto-delivered (no delivery partner integration exists)",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatched-orders"] });
      queryClient.invalidateQueries({ queryKey: ["home-stats"] });
      router.replace({
        pathname: "/dispatching/success" as any,
        params: {
          orderId: apiOrder?.orderId || apiOrder?.id,
          totalItems: apiOrder?.items?.length ?? 0,
        },
      });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again.";
      setDispatchError(message);
    },
  });

  // ── Reject / Cancel dispatch ──────────────────────────────────────────────
  const { mutateAsync: doReject, isPending: isRejecting } = useMutation({
    mutationFn: (reason: string) =>
      dispatcherApi.rejectDispatch(apiOrder!.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatched-orders"] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert("Cancel Failed", err?.message || "Something went wrong.");
    },
  });

  const isBusy = isDispatching || isRejecting;
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading)
    return (
      <AppLoader
        visible
        title="Loading order..."
        subtitle="Please wait a moment"
      />
    );

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError || !apiOrder) {
    return (
      <View className="flex-1 bg-[#F7F7F7]">
        <SafeAreaView edges={["top"]} className="bg-white">
          <View className="flex-row items-center px-5 py-4 border-b border-[#F0F0F0]">
            <BackButton />
            <Text className="text-[18px] font-inter-bold text-[#222222]">
              Order Status
            </Text>
          </View>
        </SafeAreaView>
        <View className="flex-1 items-center justify-center px-8">
          <Cancel width={80} height={80} />
          <Text className="text-[20px] font-inter-bold text-[#222222] mt-5 text-center">
            Order Not Found
          </Text>
          <Text className="text-[14px] font-inter text-[#6A6A6A] mt-2 text-center">
            No order found for: {orderId}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-8 px-10 h-[52px] rounded-[14px] items-center justify-center"
            style={{ backgroundColor: colors.brand.primary }}
            activeOpacity={0.85}
          >
            <Text className="text-white text-[16px] font-inter-semibold">
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-[#F7F7F7]">
      <SafeAreaView edges={["top"]} className="bg-white">
        <View className="flex-row items-center px-5 py-4 border-b border-[#F0F0F0]">
          <BackButton />
          <Text className="text-[18px] font-inter-bold text-[#222222]">
            Order Status
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingVertical: 32,
        }}
      >
        {/* Status icon */}
        <View className="items-center mb-5">
          {isCancelled ? (
            <Cancel width={90} height={90} />
          ) : (
            <Success width={90} height={90} />
          )}
        </View>

        {/* Order ID + label */}
        <View className="items-center mb-8">
          <Text className="text-[28px] font-inter-bold text-[#222222] mb-1">
            #{order?.orderId || orderId}
          </Text>
          <Text className="text-[15px] font-inter text-[#6A6A6A]">
            {ORDER_STATUS_LABELS[rawStatus as OrderStatusValue] ||
              (isReady
                ? "Ready for Delivery"
                : isCancelled
                  ? "Order Cancelled"
                  : `Status: ${rawStatus}`)}
          </Text>
        </View>

        {/* Info card */}
        <View
          className="bg-white rounded-[16px] px-5 py-2"
          style={{ borderWidth: 1, borderColor: "#EFEFEF" }}
        >
          <View className="flex-row items-start py-4 border-b border-[#F0F0F0]">
            <Person
              width={16}
              height={16}
              fill="#6A6A6A"
              style={{ marginTop: 2 }}
            />
            <View className="ml-3">
              <Text className="text-[13px] font-inter text-[#6A6A6A] mb-1">
                Customer Name
              </Text>
              <Text className="text-[15px] font-inter-semibold text-[#222222]">
                {order?.customerName || "—"}
              </Text>
            </View>
          </View>

          <View
            className={`flex-row items-start py-4 ${isCancelled && cancelledAt ? "border-b border-[#F0F0F0]" : ""}`}
          >
            <CalendarToday
              width={16}
              height={16}
              fill="#6A6A6A"
              style={{ marginTop: 2 }}
            />
            <View className="ml-3">
              <Text className="text-[13px] font-inter text-[#6A6A6A] mb-1">
                Order Date & Time
              </Text>
              <Text className="text-[15px] font-inter-semibold text-[#222222]">
                {order?.orderDate || "—"}
              </Text>
            </View>
          </View>

          {isCancelled && cancelledAt && (
            <View className="flex-row items-start py-4">
              <CalendarToday
                width={16}
                height={16}
                fill="#6A6A6A"
                style={{ marginTop: 2 }}
              />
              <View className="ml-3">
                <Text className="text-[13px] font-inter text-[#6A6A6A] mb-1">
                  Cancelled At
                </Text>
                <Text className="text-[15px] font-inter-semibold text-[#222222]">
                  {cancelledAt}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom button */}
      <SafeAreaView edges={["bottom"]}>
        <View className="px-5 pb-4">
          {isReady && (
            <TouchableOpacity
              onPress={() => doDispatch()}
              disabled={isBusy}
              className="w-full h-[56px] rounded-[16px] items-center justify-center"
              style={{
                backgroundColor: colors.brand.primary,
                opacity: isBusy ? 0.7 : 1,
              }}
              activeOpacity={0.85}
            >
              {isDispatching ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-[16px] font-inter-semibold">
                  Ready for Delivery
                </Text>
              )}
            </TouchableOpacity>
          )}

          {isCancelled && (
            <TouchableOpacity
              onPress={() => setShowCancelModal(true)}
              disabled={isBusy}
              className="w-full h-[56px] rounded-[16px] items-center justify-center"
              style={{
                backgroundColor: colors.brand.primary,
                opacity: isBusy ? 0.7 : 1,
              }}
              activeOpacity={0.85}
            >
              {isRejecting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-[16px] font-inter-semibold">
                  Cancel Dispatch
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* Cancel Dispatch confirmation */}
      <CancelDispatchModal
        isVisible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => {
          setShowCancelModal(false);
          doReject("Dispatch cancelled by dispatcher");
        }}
      />

      <ErrorModal
        visible={!!dispatchError}
        title="Dispatch Failed"
        message={dispatchError || ""}
        onRetry={() => {
          setDispatchError(null);
          doDispatch();
        }}
        onDismiss={() => setDispatchError(null)}
      />
    </View>
  );
};

export default OrderStatusLayout;
