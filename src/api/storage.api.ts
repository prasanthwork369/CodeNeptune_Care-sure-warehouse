import { API_ENDPOINTS } from '../utils/urls';
import { apiClient } from './client';

/**
 * Storage API - handles file uploads to S3 or storage server.
 */
export const storageApi = {
    /**
     * Uploads a file and returns the public URL.
     * 
     * @param formData - The FormData containing the 'file' and 'folder'.
     * @returns Promise with the upload response.
     */
    upload: async (formData: FormData) => {
        return apiClient.post<{ success: boolean; data: { url: string } }>(
            API_ENDPOINTS.AUTH_UPLOAD_AVATAR,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
    },
};

/**
 * User API - handles profile updates and user management.
 */
export const userApi = {
    /**
     * Updates partial user profile information.
     * 
     * @param id - The user ID.
     * @param data - The fields to update.
     */
    update: async (id: string, data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        avatarUrl?: string;
        isActive?: boolean;
    }) => {
        return apiClient.patch(`${API_ENDPOINTS.AUTH_UPDATE_PROFILE}/${id}`, data);
    },
};
