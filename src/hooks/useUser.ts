import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { userService } from '../services/user.service';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Hook to fetch the current user profile.
 * Synchronizes with the local useAuthStore for global state consistency.
 */
export const useUserQuery = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await authApi.getMe();
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch user data');
    },
    enabled: isAuthenticated, // Only fetch if we have an active session
  });
};

/**
 * Hook to update user profile information.
 * Automatically invalidates the 'user' query on success.
 */
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await userService.updateProfile(id, data);
      return response.data;
    },
    onSuccess: () => {
      // Refresh the user profile data in the cache
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
