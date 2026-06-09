import { userApi } from '../api/storage.api';
import { storageApi } from '../api/storage.api';
import { useAuthStore } from '../store/useAuthStore';

export const userService = {
    updateProfile: async (id: string, data: any) => {
        const response = await userApi.update(id, data);
        // Sync with store if it's the current user
        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.id === id) {
            useAuthStore.getState().setUser({ ...currentUser, profile: { ...currentUser.profile, ...data } });
        }
        return response;
    },

    uploadAvatar: async (uri: string, filename: string, type: string) => {
        const formData = new FormData();
        // @ts-ignore
        formData.append('file', { uri, name: filename, type });
        formData.append('folder', 'administrator/profile');
        
        const response = await storageApi.upload(formData);
        return response.data;
    }
};
