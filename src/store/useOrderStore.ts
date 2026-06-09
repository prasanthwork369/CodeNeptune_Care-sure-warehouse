import { create } from 'zustand';
import { Order, OrderStatus } from '../types/order.types';

interface OrderState {
    orders: Order[];
    ordersLoading: boolean;
    ordersError: string | null;
    activeTab: OrderStatus;

    // Setters
    setOrders: (orders: Order[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setActiveTab: (tab: OrderStatus) => void;
    clearOrders: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
    orders: [],
    ordersLoading: true,
    ordersError: null,
    activeTab: 'new',

    setOrders: (orders) => set({ orders }),
    setLoading: (ordersLoading) => set({ ordersLoading }),
    setError: (ordersError) => set({ ordersError }),
    setActiveTab: (activeTab) => set({ activeTab }),
    clearOrders: () => set({
        orders: [],
        ordersError: null,
        activeTab: 'new',
        ordersLoading: false
    })
}));
