import { orderApi } from '@/src/features/picker/api/order.api';
import { useOrderStore } from '@/src/features/picker/store/useOrderStore';
import {
  Order,
  OrderStatus,
  ListOrdersParams,
} from '@/src/features/picker/types/order.types';
import { mapOrder } from './order.mapper';

export { mapOrder } from './order.mapper';

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
