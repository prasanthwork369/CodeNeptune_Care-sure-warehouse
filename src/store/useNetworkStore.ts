import { create } from 'zustand';

interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  setIsConnected: (connected: boolean | null, reachable: boolean | null) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: null,
  isInternetReachable: null,
  setIsConnected: (connected, reachable) => set({ 
    isConnected: connected, 
    isInternetReachable: reachable 
  }),
}));
