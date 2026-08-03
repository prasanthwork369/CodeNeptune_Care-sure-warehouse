import NetInfo from "@react-native-community/netinfo";
import { useNetworkStore } from "../store/useNetworkStore";
import { requestQueue } from "./requestQueue";

export const initNetworkListener = (axiosInstance: any) => {
  // Restore any requests queued in a previous session
  requestQueue.loadFromStorage();

  // Instantly fetch current network state on launch
  NetInfo.fetch().then((state) => {
    useNetworkStore
      .getState()
      .setIsConnected(state.isConnected, state.isInternetReachable);
  });

  return NetInfo.addEventListener((state) => {
    const isConnected = state.isConnected;
    const isInternetReachable = state.isInternetReachable;

    const wasFullyConnected =
      useNetworkStore.getState().isConnected === true &&
      useNetworkStore.getState().isInternetReachable === true;

    useNetworkStore.getState().setIsConnected(isConnected, isInternetReachable);

    const isNowFullyConnected =
      isConnected === true && isInternetReachable === true;
    if (!wasFullyConnected && isNowFullyConnected) {
      requestQueue.process(axiosInstance);
    }
  });
};
