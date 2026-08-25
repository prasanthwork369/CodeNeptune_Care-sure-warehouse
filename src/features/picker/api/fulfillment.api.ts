import { API_ENDPOINTS } from "@/src/utils/urls";
import { apiClient } from "@/src/api/client";
import {
  LockResult,
  ActiveLock,
  ExtendMinutes,
} from '@/src/features/picker/types/fulfillment.types';

export const fulfillmentApi = {
  pick: async (
    orderId: string,
    items: Array<{ orderItemId: string; pickedQuantity: number }>,
  ): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.FULFILLMENT_PICK(orderId), { items }, {
      _queued: true,
    } as any);
  },

  claim: async (orderId: string): Promise<LockResult> => {
    const response = await apiClient.post(
      API_ENDPOINTS.FULFILLMENT_CLAIM(orderId),
    );
    return response.data.data;
  },

  release: async (orderId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.FULFILLMENT_RELEASE(orderId));
  },

  extend: async (
    orderId: string,
    minutes: ExtendMinutes,
  ): Promise<LockResult> => {
    const response = await apiClient.patch(
      API_ENDPOINTS.FULFILLMENT_EXTEND(orderId),
      { minutes },
    );
    return response.data.data;
  },

  getActiveLocks: async (): Promise<ActiveLock[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.FULFILLMENT_ACTIVE_LOCKS,
    );
    return response.data.data;
  },

  pack: async (
    orderId: string,
    items: Array<{ orderItemId: string; packedQuantity: number }>,
    confirmPartial?: boolean,
  ): Promise<void> => {
    await apiClient.post(
      API_ENDPOINTS.FULFILLMENT_PACK(orderId),
      { items, confirmPartial },
      { _queued: true } as any,
    );
  },

  submitQualityChecks: async (
    orderId: string,
    checks: Array<{ orderItemId: string; reason: string; notes?: string }>,
  ): Promise<void> => {
    await apiClient.post(
      API_ENDPOINTS.FULFILLMENT_QUALITY_CHECKS(orderId),
      { checks },
      { _queued: true } as any,
    );
  },
};
