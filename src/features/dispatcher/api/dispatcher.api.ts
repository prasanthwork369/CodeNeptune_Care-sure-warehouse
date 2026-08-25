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
    const response = await apiClient.get<{ success: boolean; data: ApiOrder }>(
      API_ENDPOINTS.DISPATCHER_QUEUE_BY_ID(orderId),
    );
    return response.data.data;
  },

  dispatch: async (orderId: string): Promise<void> => {
    await apiClient.post(
      API_ENDPOINTS.FULFILLMENT_DISPATCH(orderId),
      undefined,
      { _queued: true } as any,
    );
  },

  rejectDispatch: async (orderId: string, reason: string): Promise<void> => {
    await apiClient.post(
      API_ENDPOINTS.FULFILLMENT_REJECT_DISPATCH(orderId),
      { reason },
      { _queued: true } as any,
    );
  },
};
