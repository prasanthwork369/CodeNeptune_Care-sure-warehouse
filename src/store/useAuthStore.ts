import { create } from 'zustand';
import { User } from '@/src/types/auth.types';
import { tokenStorage } from '@/src/lib/storage';
import { setAccessToken } from '@/src/api/client';
import { authApi } from '@/src/api/auth.api';
import { decodeJWT } from '@/src/utils/jwt';

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

const extractTokenData = (token: string) => {
    const payload = decodeJWT(token);
    return {
        roles: (payload?.roles ?? []).map(r => r.toLowerCase().trim()),
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
            if (token) {
                setAccessToken(token);
                const { roles, permissions } = extractTokenData(token);
                set({ accessToken: token, isAuthenticated: true, roles, permissions });
                try {
                    const response = await authApi.getMe();
                    if (response.success) {
                        set({ user: response.data });
                    }
                } catch {
                    console.warn('[Auth] Session verification failed.');
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
        await tokenStorage.set(token);
        if (expiresIn) {
            await tokenStorage.setExpiresAt(Date.now() + expiresIn * 1000);
        }
    },

    logout: async () => {
        setAccessToken(null);
        set({ user: null, roles: [], permissions: [], accessToken: null, isAuthenticated: false });
        await tokenStorage.clearToken();
    },
}));
