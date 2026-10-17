import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import {
  useNotificationStore,
  NotificationType,
} from "../store/useNotificationStore";
import { useOrderStore } from "@/src/features/picker/store/useOrderStore";

/**
 * Configure global foreground handler (Suppresses OS banners when app is open)
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  /**
   * Centralized response handler for notification taps.
   * Handles deep linking and history recording.
   */
  async handleNotificationResponse(
    response: Notifications.NotificationResponse,
  ) {
    const data = response.notification.request.content.data as {
      orderId?: string;
      type?: NotificationType;
    };
    const { orderId, type } = data;
    const { title, body } = response.notification.request.content;

    if (response.actionIdentifier === "ignore") {
      await Notifications.dismissNotificationAsync(
        response.notification.request.identifier,
      );
      return;
    }

    if (orderId) {
      // Ensure it's recorded in history silently (Avoid double-toast)
      useNotificationStore.getState().addNotification({
        title: title || "Order Update",
        message: body || "",
        type: type || "success",
        orderId,
        silent: true, // Only update history, don't show toast again
      });

      // Clear the custom toast if it was showing
      useNotificationStore
        .getState()
        .removeNotification(response.notification.request.identifier);

      // Deep Linking Navigation
      useOrderStore.getState().setActiveTab("new");
      router.push("/(tabs)/picker");
    }
  },
};
