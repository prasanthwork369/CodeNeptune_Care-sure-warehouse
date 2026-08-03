import { create } from "zustand";

interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  offlineAlertVisible: boolean;
  setIsConnected: (
    connected: boolean | null,
    reachable: boolean | null,
  ) => void;
  showOfflineAlert: () => void;
  hideOfflineAlert: () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: null,
  isInternetReachable: null,
  offlineAlertVisible: false,
  setIsConnected: (connected, reachable) =>
    set({
      isConnected: connected,
      isInternetReachable: reachable,
    }),
  showOfflineAlert: () => set({ offlineAlertVisible: true }),
  hideOfflineAlert: () => set({ offlineAlertVisible: false }),
}));
