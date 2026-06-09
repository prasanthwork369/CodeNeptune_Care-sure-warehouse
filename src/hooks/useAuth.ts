import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';

export const useAuth = () => {
    const queryClient = useQueryClient();

    const loginMutation = useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            authService.login(email, password),
    });

    const logoutMutation = useMutation({
        mutationFn: authService.logout,
        onSuccess: () => queryClient.clear(),
    });

    return {
        login: (email: string, password: string) =>
            loginMutation.mutateAsync({ email, password }),
        logout: () => logoutMutation.mutateAsync(),
        isLoggingIn: loginMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
        error: loginMutation.error?.message ?? null,
    };
};
