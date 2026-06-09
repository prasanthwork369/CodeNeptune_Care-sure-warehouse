import { create } from 'zustand';
import { WarehouseStat } from '../types/home';

interface HomeState {
    warehouseStats: WarehouseStat[];
    statsLoading: boolean;
    statsError: string | null;

    setStats: (stats: WarehouseStat[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearStats: () => void;
}

export const useHomeStore = create<HomeState>((set) => ({
    warehouseStats: [],
    statsLoading: false,
    statsError: null,

    setStats: (warehouseStats) => set({ warehouseStats }),
    setLoading: (statsLoading) => set({ statsLoading }),
    setError: (statsError) => set({ statsError }),
    clearStats: () => set({ warehouseStats: [], statsError: null }),
}));
