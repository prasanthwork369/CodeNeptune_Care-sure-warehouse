import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { playSound } from "../utils/audio";

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "critical";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  orderId?: string;
  imageUrl?: string;
  timestamp: number;
}

interface NotificationState {
  visible: Notification[]; // Items currently on screen (max 3)
  queue: Notification[]; // Items waiting to be shown
  history: Notification[]; // Last 20 notifications (persisted)

  addNotification: (
    notification: Omit<Notification, "id" | "timestamp"> & { silent?: boolean },
  ) => void;
  removeNotification: (id: string) => void;
  clearHistory: () => void;
}

const MAX_VISIBLE = 3;
const MAX_HISTORY = 20;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      visible: [],
      queue: [],
      history: [],

      addNotification: (params) => {
        const id = Math.random().toString(36).substring(7);
        const timestamp = Date.now();
        const newNotification: Notification = {
          ...params,
          id,
          timestamp,
          type: params.type || "info",
        };

        // Play sound with priority logic (handled in audio utils)
        playSound(newNotification.type).catch((e) => {
          if (__DEV__) console.warn("Sound play skipped", e);
        });

        set((state) => {
          // 1. Update History (Limit to last 20)
          const newHistory = [newNotification, ...state.history].slice(
            0,
            MAX_HISTORY,
          );

          // If silent, only update history and stop here
          if (params.silent) {
            return { history: newHistory };
          }

          // 2. Prevent duplicates in active UI (check visible + queue)
          const isDuplicate = [...state.visible, ...state.queue].some(
            (n) => n.orderId && n.orderId === params.orderId,
          );

          if (isDuplicate) {
            return { history: newHistory };
          }

          // 3. Handle Visibility vs Queuing
          if (state.visible.length < MAX_VISIBLE) {
            return {
              history: newHistory,
              visible: [...state.visible, newNotification],
            };
          } else {
            return {
              history: newHistory,
              queue: [...state.queue, newNotification],
            };
          }
        });
      },

      removeNotification: (id) => {
        set((state) => {
          const newVisible = state.visible.filter((n) => n.id !== id);

          // If we have space and items in queue, pull the next one
          if (newVisible.length < MAX_VISIBLE && state.queue.length > 0) {
            const [next, ...remainingQueue] = state.queue;
            return {
              visible: [...newVisible, next],
              queue: remainingQueue,
            };
          }

          return { visible: newVisible };
        });
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "notification-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist history, not transient UI state
      partialize: (state) => ({ history: state.history }),
    },
  ),
);
