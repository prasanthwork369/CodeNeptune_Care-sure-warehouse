import { create } from "zustand";
import { User } from "@/src/features/auth/types/auth.types";
import { tokenStorage } from "@/src/lib/storage";
import { setAccessToken } from "@/src/api/client";
import { authApi } from "@/src/features/auth/api/auth.api";
import { decodeJWT } from "@/src/utils/jwt";
import { requestQueue } from "@/src/utils/requestQueue";
import { useOrderStore } from "@/src/features/picker/store/useOrderStore";
import { useNotificationStore } from "@/src/store/useNotificationStore";

interface AuthState {
  user: User | null;
  roles: string[];
  permissions: string[];
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoaded: boolean;

  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
  login: (token: string, expiresIn?: number) => Promise<void>;
  logout: () => Promise<void>;
}

// Unique per login; it only has to differ from every earlier session
const newSessionId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const extractTokenData = (token: string) => {
  const payload = decodeJWT(token);
  return {
    roles: (payload?.roles ?? []).map((r) => r.toLowerCase().trim()),
    permissions: payload?.permissions ?? [],
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  roles: [],
  permissions: [],
  accessToken: null,
  isAuthenticated: false,
  isLoaded: false,

  setUser: (user) => set({ user }),

  initialize: async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        void useNotificationStore.getState().setSession(null);
      } else {
        setAccessToken(token);
        const { roles, permissions } = extractTokenData(token);
        set({ accessToken: token, isAuthenticated: true, roles, permissions });
        // Logged in before session ids existed: start one (history saved
        // without one is never shown)
        let sessionId = await tokenStorage.getSessionId();
        if (!sessionId) {
          sessionId = newSessionId();
          await tokenStorage.setSessionId(sessionId);
        }
        void useNotificationStore.getState().setSession(sessionId);
        try {
          const response = await authApi.getMe();
          if (response.success) {
            set({ user: response.data });
          }
        } catch {
          console.warn("[Auth] Session verification failed.");
        }
      }
    } finally {
      set({ isLoaded: true });
    }
  },

  login: async (token: string, expiresIn?: number) => {
    setAccessToken(token);
    const { roles, permissions } = extractTokenData(token);
    set({ accessToken: token, isAuthenticated: true, roles, permissions });
    const sessionId = newSessionId();
    void useNotificationStore.getState().setSession(sessionId);
    await tokenStorage.setSessionId(sessionId);
    await tokenStorage.set(token);
    if (expiresIn) {
      await tokenStorage.setExpiresAt(Date.now() + expiresIn * 1000);
    }
  },

  logout: async () => {
    // First, so a replay in progress stops before the token changes and the
    // next user to log in never sends this user's queued offline requests
    const clearingQueue = requestQueue.clear();
    setAccessToken(null);
    set({
      user: null,
      roles: [],
      permissions: [],
      accessToken: null,
      isAuthenticated: false,
    });
    // The picker queue mirrored from the API is this user's data
    useOrderStore.getState().clearOrders();
    // Ends this session's notification history (cleared, and hidden from any
    // later session even if clearing the stored copy fails)
    void useNotificationStore.getState().setSession(null);
    await Promise.all([tokenStorage.clearToken(), clearingQueue]);
  },
}));
