import { create } from 'zustand';

interface TabBarState {
    tabBarHeight: number;
    setTabBarHeight: (h: number) => void;
}

export const useTabBarStore = create<TabBarState>((set) => ({
    tabBarHeight: 120,
    setTabBarHeight: (h) => set({ tabBarHeight: h }),
}));
