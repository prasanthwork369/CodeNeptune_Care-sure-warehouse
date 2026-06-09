import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const EXPIRES_AT_KEY = 'token_expires_at';

export const storage = {
    saveToken: async (accessToken: string) => {
        try {
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        } catch (error) {
            console.error('Error saving token:', error);
        }
    },

    getAccessToken: async () => {
        try {
            return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        } catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    },

    clearToken: async () => {
        try {
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
            await SecureStore.deleteItemAsync(EXPIRES_AT_KEY);
        } catch (error) {
            console.error('Error clearing token:', error);
        }
    },

    // Compatibility methods for new client.ts
    set: async (token: string) => storage.saveToken(token),
    
    setExpiresAt: async (timestamp: number) => {
        try {
            await SecureStore.setItemAsync(EXPIRES_AT_KEY, timestamp.toString());
        } catch (error) {
            console.error('Error saving expires at:', error);
        }
    },

    getExpiresAt: async () => {
        const val = await SecureStore.getItemAsync(EXPIRES_AT_KEY);
        return val ? parseInt(val, 10) : null;
    }
};

// Also export as tokenStorage for convenience
export const tokenStorage = storage;
export default storage;
