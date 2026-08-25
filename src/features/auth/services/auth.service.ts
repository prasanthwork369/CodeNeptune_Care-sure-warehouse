import { authApi } from "../api/auth.api";
import { useAuthStore } from "@/src/store/useAuthStore";

export const authService = {
  login: async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    if (response.success && response.data) {
      const { accessToken, expiresIn } = response.data;
      await useAuthStore.getState().login(accessToken, expiresIn);
      try {
        const userResponse = await authApi.getMe();
        if (userResponse.success) {
          useAuthStore.getState().setUser(userResponse.data);
        }
      } catch {
        if (__DEV__)
          console.warn("[Auth] Could not fetch profile after login.");
      }
    }
    return response;
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      await useAuthStore.getState().logout();
    }
  },
};
