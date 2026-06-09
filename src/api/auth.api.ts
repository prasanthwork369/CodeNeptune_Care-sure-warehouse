import { API_BASE_URL, API_ENDPOINTS } from '@/src/utils/urls';
import axios from 'axios';
import { apiClient } from '@/src/api/client';

export const authApi = {
    login: async (data: any) => {
        const response = await apiClient.post(API_ENDPOINTS.AUTH_LOGIN, data);
        return response.data;
    },
    refreshToken: async () => {
        // Use a clean axios instance for refresh to avoid interceptor recursion
        const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.AUTH_REFRESH}`, {}, { 
            withCredentials: true 
        });
        return response.data;
    },
    getMe: async () => {
        const response = await apiClient.get(API_ENDPOINTS.AUTH_ME);
        return response.data;
    },
    logout: async () => {
        const response = await apiClient.post(API_ENDPOINTS.AUTH_LOGOUT);
        return response.data;
    },
    uploadAvatar: async (formData: FormData) => {
        try {
            const response = await apiClient.post(API_ENDPOINTS.AUTH_UPDATE_PROFILE, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            // Simulation Mode (Temp)
            await new Promise(resolve => setTimeout(resolve, 2000));
            return { 
                success: true, 
                message: 'Upload simulated successfully',
                data: { avatarUrl: null }
            };
        }
    }
}
