import { API_ENDPOINTS } from "@/src/utils/urls";
import { apiClient } from "@/src/api/client";
import {
  ApiOrder,
  ApiPickerQueueResponse,
  ListOrdersParams,
} from '@/src/features/picker/types/order.types';
import { FulfillmentStats } from "@/src/features/home/types/home";

export const orderApi = {
  list: async (params?: ListOrdersParams): Promise<ApiOrder[]> => {
    const response = await apiClient.get<ApiPickerQueueResponse>(
      API_ENDPOINTS.GET_PICKER_QUEUE,
      { params },
    );
    return response.data.data;
  },

  listDetailed: async (params?: ListOrdersParams): Promise<ApiOrder[]> => {
    const response = await apiClient.get<ApiPickerQueueResponse>(
      API_ENDPOINTS.GET_PICKER_QUEUE_DETAILED,
      { params },
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<ApiOrder> => {
    const response = await apiClient.get<{ success: boolean; data: ApiOrder }>(
      API_ENDPOINTS.GET_ORDER_BY_ID(id),
    );
    return response.data.data;
  },

  updateStatus: async (
    id: string,
    status: number,
    reason?: string,
  ): Promise<void> => {
    await apiClient.patch(API_ENDPOINTS.UPDATE_ORDER_STATUS(id), {
      status,
      reason,
    });
  },

  listPicked: async (): Promise<ApiOrder[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { items: ApiOrder[] };
    }>(API_ENDPOINTS.PICKER_PICKED);
    return response.data.data.items;
  },

  listPacked: async (): Promise<ApiOrder[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { items: ApiOrder[] };
    }>(API_ENDPOINTS.PACKER_PACKED);
    return response.data.data.items;
  },

  getDashboardStats: (params?: { fromDate?: string; toDate?: string }) =>
    apiClient.get<{ success: boolean; data: FulfillmentStats }>(
      API_ENDPOINTS.DASHBOARD_FULFILLMENT_STATS,
      { params },
    ),
};
