import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { useNotificationStore, NotificationType } from '../store/useNotificationStore';
import { useOrderStore } from '../store/useOrderStore';

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
   * Main API for triggering a notification.
   * Dynamically routes to the store (Foreground) or the OS (Background).
   */
  async notify(params: {
    title: string;
    message: string;
    type: NotificationType;
    orderId?: string;
    imageUrl?: string;
    delaySeconds?: number;
  }) {
    // If there is a delay, we force a Background/System notification 
    // so the user has time to minimize the app.
    const isForeground = !params.delaySeconds && AppState.currentState === 'active';

    if (isForeground) {
      // 1. Send to Custom In-App UI (Full feature support including images)
      useNotificationStore.getState().addNotification({
        title: params.title,
        message: params.message,
        type: params.type,
        orderId: params.orderId,
        imageUrl: params.imageUrl,
      });
    } else {
      // 2. Send to System Notification Tray (Background/Delayed)
      // Save to history immediately so user can see it in-app later
      useNotificationStore.getState().addNotification({
        title: params.title,
        message: params.message,
        type: params.type,
        orderId: params.orderId,
        imageUrl: params.imageUrl,
      });

      // Schedule the OS notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: params.title,
          body: params.message,
          data: { orderId: params.orderId, type: params.type, imageUrl: params.imageUrl },
          sound: true,
          color: params.type === 'critical' ? '#FF0000' : '#117C3F',
          categoryIdentifier: 'order_alert',
          attachments: params.imageUrl ? [{ 
            url: params.imageUrl,
            identifier: 'order_image_' + Date.now(),
            type: 'image'
          }] : [],
        },
        trigger: params.delaySeconds 
          ? { 
              seconds: params.delaySeconds, 
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              channelId: 'default' // Proper place for Android Channel ID
            } 
          : {
              channelId: 'default', // Ensures immediate notifications also use the channel
              type: Notifications.SchedulableTriggerInputTypes.DATE, // Fallback for "now"
              date: new Date(Date.now() + 500) // Slight offset for "instant" OS trigger
            },
      });
    }
  },

  /**
   * Centralized response handler for notification taps.
   * Handles deep linking and history recording.
   */
  async handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data as { orderId?: string; type?: NotificationType };
    const { orderId, type } = data;
    const { title, body } = response.notification.request.content;

    if (response.actionIdentifier === 'ignore') {
      await Notifications.dismissNotificationAsync(response.notification.request.identifier);
      return;
    }

    if (orderId) {
      // Ensure it's recorded in history silently (Avoid double-toast)
      useNotificationStore.getState().addNotification({
        title: title || 'Order Update',
        message: body || '',
        type: type || 'success',
        orderId,
        silent: true, // Only update history, don't show toast again
      });

      // Clear the custom toast if it was showing
      useNotificationStore.getState().removeNotification(response.notification.request.identifier);

      // Deep Linking Navigation
      useOrderStore.getState().setActiveTab('new');
      router.push('/(tabs)/picker');
    }
  }
};
