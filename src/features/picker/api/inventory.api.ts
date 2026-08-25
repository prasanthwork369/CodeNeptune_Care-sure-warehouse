import { apiClient } from "@/src/api/client";
import { API_ENDPOINTS } from "@/src/utils/urls";

export interface InventoryBatch {
  id: string;
  batchNumber: string;
  expiryDate?: string;
  quantity: number;
}

export const inventoryApi = {
  getBatches: (medicineId: string): Promise<InventoryBatch[]> =>
    apiClient
      .get(API_ENDPOINTS.INVENTORY_BATCHES, {
        params: { medicineId, limit: 100 },
      })
      .then((res) => res.data?.data ?? res.data ?? []),
};
