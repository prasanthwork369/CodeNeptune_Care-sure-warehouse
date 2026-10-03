import "@/global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useAuthStore } from "@/src/store/useAuthStore";

import NotificationManager from "@/src/components/common/NotificationManager";
import NetworkToast from "@/src/components/common/NetworkToast";
import { initNetworkListener } from "@/src/utils/network";
import { requestQueue } from "@/src/utils/requestQueue";
import axiosInstance from "@/src/api/client";
import { setUnauthorizedHandler } from "@/src/api/client";
import { retryTransientOnce } from "@/src/api/errors";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import { AppState, Platform } from "react-native";

import * as Notifications from "expo-notifications";
import { notificationService } from "@/src/services/notification.service";
import { useNotificationStore } from "@/src/store/useNotificationStore";
import {
  useSyncFulfillment,
  useReleaseStaleLocks,
} from "@/src/features/picker/hooks/useFulfillment";

SplashScreen.preventAutoHideAsync();

// Mounted once at the root (not in the (tabs) layout) so there is exactly one
// Socket.IO connection and one set of order/lock listeners per session, even
// if the navigation stack ever holds more than one (tabs) instance. Both hooks
// stay idle until the user is authenticated.
function FulfillmentSync() {
  useSyncFulfillment();
  // Release locks orphaned by an app kill/reload mid-pick (otherwise the
  // claimed order stays hidden from the queue for ~10 min)
  useReleaseStaleLocks();
  return null;
}

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: retryTransientOnce,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Never auto-retry state-changing requests (claim/pick/pack/dispatch)
      retry: false,
    },
  },
});

// React Query has no `document` on native, so it treats the app as always
// focused and keeps refetchInterval polling while backgrounded. Tie focus to
// AppState instead; web keeps its built-in visibilitychange listener.
if (Platform.OS !== "web") {
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (__DEV__) console.log(`[AppState] ${state}`);
      handleFocus(state === "active");
    });
    return () => subscription.remove();
  });
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const { isAuthenticated, isLoaded } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // 1. Core Auth & Storage Init
    useAuthStore.getState().initialize();

    // 2. Unauthorized handler — logs out when refresh token expires
    setUnauthorizedHandler(() => {
      queryClient.clear();
      requestQueue.clear();
      useAuthStore.getState().logout();
    });

    // 2. Initialize network listener
    const unsubscribeNet = initNetworkListener(axiosInstance);

    // 3. Handle an initial notification response without requesting permission.
    // Push permission is requested after the authenticated Home screen renders.
    const handleInitialNotificationResponse = async () => {
      // Check if app was opened by a notification (Killed state)
      const initialResponse =
        await Notifications.getLastNotificationResponseAsync();
      if (initialResponse) {
        notificationService.handleNotificationResponse(initialResponse);
      }
    };

    handleInitialNotificationResponse();

    // Listener for foreground notifications (Suppressed OS banner, Trigger Custom UI)
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;
        useNotificationStore.getState().addNotification({
          title: title || "Update",
          message: body || "",
          type: (data?.type as any) || "info",
          orderId: data?.orderId as string | undefined,
          imageUrl: data?.imageUrl as string | undefined, // Support images in OS-triggered notifications
        });
      },
    );

    // Listener for notification taps (Deep Linking)
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        notificationService.handleNotificationResponse(response);
      });

    return () => {
      unsubscribeNet();
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoaded, segments, loaded]);

  useEffect(() => {
    if ((loaded || error) && isLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isLoaded]);

  if ((!loaded && !error) || !isLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <NotificationManager />
          <FulfillmentSync />
          <Stack screenOptions={{ headerShown: false }} />
          <NetworkToast />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
