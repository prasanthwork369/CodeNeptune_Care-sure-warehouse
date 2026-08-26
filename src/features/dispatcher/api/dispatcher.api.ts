import { API_ENDPOINTS } from "@/src/utils/urls";
import { apiClient } from "@/src/api/client";
import { ApiOrder } from '@/src/features/picker/types/order.types';
import { DispatchedOrder } from '@/src/features/dispatcher/types/dispatcher';

export const dispatcherApi = {
  getAllDispatcherOrders: async (): Promise<ApiOrder[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { items: ApiOrder[] };
    }>(API_ENDPOINTS.DISPATCHER_DISPATCHED);
    return response.data.data.items ?? [];
  },

  getOrderForDispatch: async (orderId: string): Promise<ApiOrder> => {
    console.log("📡 [Dispatcher API] Fetching order for dispatch:", orderId);
    const response = await apiClient.get<{ success: boolean; data: ApiOrder }>(
      API_ENDPOINTS.DISPATCHER_QUEUE_BY_ID(orderId),
    );
    console.log("📦 [Dispatcher API] getOrderForDispatch response:", {
      id: response.data?.data?.id,
      orderId: response.data?.data?.orderId,
      status: response.data?.data?.status,
    });
    return response.data.data;
  },

  dispatch: async (orderId: string): Promise<void> => {
    console.log("🚚 [Dispatcher API] Dispatching order ID:", orderId);
    await apiClient.post(
      API_ENDPOINTS.FULFILLMENT_DISPATCH(orderId),
      undefined,
      { _queued: true } as any,
    );
    console.log("✅ [Dispatcher API] Dispatched successfully:", orderId);
  },

  rejectDispatch: async (orderId: string, reason: string): Promise<void> => {
    console.log("❌ [Dispatcher API] Rejecting dispatch for order:", orderId, "Reason:", reason);
    await apiClient.post(
      API_ENDPOINTS.FULFILLMENT_REJECT_DISPATCH(orderId),
      { reason },
      { _queued: true } as any,
    );
  },
};
