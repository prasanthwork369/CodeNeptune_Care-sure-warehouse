import NetInfo from "@react-native-community/netinfo";
import { useNetworkStore } from "../store/useNetworkStore";
import { requestQueue } from "./requestQueue";

export const initNetworkListener = (
  axiosInstance: any,
  // Startup session restore (useAuthStore.initialize)
  sessionRestored: Promise<unknown>,
) => {
  // Restore any requests queued in a previous session
  const queueLoaded = requestQueue.loadFromStorage();

  // Replay needs the saved queue loaded and the session restored, to know
  // whose requests may be sent. A connectivity event before that would find
  // nothing to send (or no session) and the queue would wait for the next
  // reconnect, so every attempt waits for both — including one at startup.
  const ready = Promise.all([queueLoaded, sessionRestored]).catch(() => {});
  const replayIfOnline = () =>
    ready.then(() => {
      const { isConnected, isInternetReachable } = useNetworkStore.getState();
      if (isConnected === true && isInternetReachable === true) {
        requestQueue.process(axiosInstance);
      }
    });

  // Instantly fetch current network state on launch
  NetInfo.fetch().then((state) => {
    useNetworkStore
      .getState()
      .setIsConnected(state.isConnected, state.isInternetReachable);
  });

  replayIfOnline();

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
      replayIfOnline();
    }
  });
};
