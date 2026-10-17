import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  // Login session the history belongs to (persisted with it)
  historySession: string | null;

  addNotification: (
    notification: Omit<Notification, "id" | "timestamp"> & { silent?: boolean },
  ) => void;
  removeNotification: (id: string) => void;
  clearHistory: () => void;
  // Called by the auth store with the current login session (null: logged out)
  setSession: (session: string | null) => Promise<void>;
}

const MAX_VISIBLE = 3;
const MAX_HISTORY = 20;

// The persisted history is only shown to the login session that recorded
// it. Logout clears it, but if that write fails the old copy stays on disk;
// tagging it with its session keeps it hidden from any later session, even
// the same user's next login. Untagged (legacy) history is never shown.
//
// undefined until the auth store reports the session at startup; the stored
// history is loaded only then, so it is never shown before that check.
let currentSession: string | null | undefined;
let hydrationStarted = false;
// Stored history has been loaded and checked; writes are safe from now on
let historyChecked = false;
// Bumped on every session change after startup (logout, login). Each value
// has its own addNotification; see addNotificationFor.
let sessionGeneration = 0;

const jsonStorage = createJSONStorage<Partial<NotificationState>>(
  () => AsyncStorage,
)!;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => {
      // Screens keep the addNotification they rendered with, and request
      // callbacks run even after the screen unmounts. One handed out in an
      // earlier session (e.g. User A's claim failing after logout) does
      // nothing, so it can't show a toast or add history in a later session.
      const addNotificationFor =
        (generation: number): NotificationState["addNotification"] =>
        (params) => {
          if (generation !== sessionGeneration) return;

          const id = Math.random().toString(36).substring(7);
          const timestamp = Date.now();
          const newNotification: Notification = {
            ...params,
            id,
            timestamp,
            type: params.type || "info",
          };

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
        };

      return {
        visible: [],
        queue: [],
        history: [],
        historySession: null,

        addNotification: addNotificationFor(sessionGeneration),

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

        setSession: async (session) => {
          const changed = session !== currentSession;
          const startup = currentSession === undefined;
          currentSession = session;
          // Toasts on screen or waiting belong to the session that ended
          if (changed && !startup) {
            sessionGeneration++;
            set({
              visible: [],
              queue: [],
              addNotification: addNotificationFor(sessionGeneration),
            });
          }
          if (!hydrationStarted) {
            hydrationStarted = true;
            await useNotificationStore.persist.rehydrate();
            historyChecked = true;
            // Persist the checked result, replacing history that wasn't shown
            set({});
            return;
          }
          // A load still in progress reads currentSession when it finishes
          if (changed && historyChecked) {
            set({ history: [], historySession: session });
          }
        },
      };
    },
    {
      name: "notification-storage",
      storage: {
        ...jsonStorage,
        // No writes before the stored history has been checked: they would
        // overwrite a valid session's history with this launch's state
        setItem: async (name, value) => {
          if (!historyChecked) return;
          try {
            await jsonStorage.setItem(name, value);
          } catch {
            // Storage failure: a stale copy left on disk stays hidden from
            // other sessions by its session tag
          }
        },
      },
      skipHydration: true,
      // Only persist history, not transient UI state
      partialize: (state) => ({
        history: state.history,
        historySession: state.historySession,
      }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<NotificationState> | undefined;
        const owned =
          !!currentSession && stored?.historySession === currentSession;
        return {
          ...current,
          // Notifications received this launch before the load come first
          history: owned
            ? [...current.history, ...(stored.history ?? [])].slice(
                0,
                MAX_HISTORY,
              )
            : current.history,
          historySession: currentSession ?? null,
        };
      },
    },
  ),
);
