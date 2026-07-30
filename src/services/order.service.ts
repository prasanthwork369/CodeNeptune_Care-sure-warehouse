import { orderApi } from "../api/order.api";
import { useOrderStore } from "../store/useOrderStore";
import {
  ApiOrder,
  Order,
  OrderItem,
  OrderStatus,
  ListOrdersParams,
} from "../types/order.types";
import {
  formatTimeAgo,
  formatOrderDate,
  formatExpiryDate,
} from "../utils/dateUtils";
import { ORDER_STATUS } from "../constants/order.constants";

export const mapOrder = (apiOrder: ApiOrder): Order => {
  const medicineNames =
    apiOrder.items?.map((it) => it.medicineSnapshot.name) || [];
  const uniqueNames = Array.from(new Set(medicineNames));
  const medicineSlug = uniqueNames.join(", ") || "No items";

  const pickingItems: OrderItem[] =
    apiOrder.items?.map((it) => ({
      id: it.id,
      medicineId: it.medicineId,
      name: it.medicineSnapshot.name,
      requiredQty: it.quantity,
      pickedQty: 0,
      status: it.status.toLowerCase() as any,
      image:
        it.medicineSnapshot.thumbnailUrl ||
        (it.medicineSnapshot as any).imageUrl ||
        (it.medicineSnapshot as any).image ||
        undefined,
      batchNo: it.batchNumber,
      expiryDate: it.expiryDate ? formatExpiryDate(it.expiryDate) : undefined,
      fulfillmentType: it.fulfillmentType as any,
    })) || [];

  const orderImages =
    (apiOrder.items
      ?.map(
        (it) =>
          it.medicineSnapshot.thumbnailUrl ||
          (it.medicineSnapshot as any).imageUrl ||
          (it.medicineSnapshot as any).image,
      )
      .filter(Boolean) as string[]) || [];

  const PICKED_STATUSES = new Set(["picked", "packed"]);
  const pickedCount =
    apiOrder.items?.filter((it) => PICKED_STATUSES.has(it.status.toLowerCase()))
      .length ?? 0;
  const totalCount = apiOrder.items?.length ?? 0;
  const outOfStockMeds =
    apiOrder.items
      ?.filter((it) => !PICKED_STATUSES.has(it.status.toLowerCase()))
      .map((it) => it.medicineSnapshot.name) ?? [];

  return {
    id: apiOrder.id,
    orderId: apiOrder.orderId,
    customerName: apiOrder.customer
      ? [apiOrder.customer.firstName, apiOrder.customer.lastName]
          .filter(Boolean)
          .join(" ") || "N/A"
      : "N/A",
    orderDate: formatOrderDate(apiOrder.createdAt),
    timeAgo: formatTimeAgo(apiOrder.createdAt),
    medicineSlug,
    status:
      apiOrder.status === ORDER_STATUS.PACKED
        ? "completed"
        : apiOrder.status === ORDER_STATUS.PICKED ||
            apiOrder.status === ORDER_STATUS.PARTIALLY_PICKED
          ? "partial"
          : "new",
    totalItems:
      apiOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    items: medicineNames,
    images: orderImages.slice(0, 4),
    pickingItems,
    date: apiOrder.createdAt,
    completionDate: formatOrderDate(apiOrder.updatedAt || apiOrder.createdAt),
    outOfStockMeds,
    pickedCount,
    totalCount,
    stockStatus: outOfStockMeds.length === 0 ? "available" : "waiting",
    pickedBy: (apiOrder as any).picker
      ? [(apiOrder as any).picker.firstName, (apiOrder as any).picker.lastName]
          .filter(Boolean)
          .join(" ")
      : (apiOrder as any).pickerName || (apiOrder as any).pickedBy || undefined,
  };
};

export const orderService = {
  list: async (params?: ListOrdersParams): Promise<Order[]> => {
    const data = await orderApi.list(params);
    const orders = data.map(mapOrder);
    useOrderStore.getState().setOrders(orders);
    return orders;
  },

  listDetailed: async (params?: ListOrdersParams): Promise<Order[]> => {
    const data = await orderApi.listDetailed(params);
    return data.map(mapOrder);
  },

  getById: async (id: string): Promise<Order> => {
    const data = await orderApi.getById(id);
    return mapOrder(data);
  },

  updateStatus: (id: string, status: number, reason?: string) =>
    orderApi.updateStatus(id, status, reason),

  setActiveTab: (tab: OrderStatus) =>
    useOrderStore.getState().setActiveTab(tab),

  clearOrders: () => useOrderStore.getState().clearOrders(),
};
