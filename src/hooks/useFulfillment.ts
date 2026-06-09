import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fulfillmentApi } from '../api/fulfillment.api';
import { ExtendMinutes } from '../types/fulfillment.types';
import { toAppError } from '../api/errors';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSocket } from './useSocket';

/**
 * Fetches and tracks all active picker locks.
 * Polls every 30s as a fallback when sockets are unavailable.
 */
export function useActiveLocks() {
    return useQuery({
        queryKey: ['active-locks'],
        queryFn: () => fulfillmentApi.getActiveLocks(),
        refetchInterval: 30000,
    });
}

/**
 * Synchronizes fulfillment state via WebSockets.
 * Listens for order lock events and invalidates relevant queries.
 */
export function useSyncFulfillment() {
    const queryClient = useQueryClient();
    const { on, isConnected } = useSocket();

    useEffect(() => {
        if (!isConnected) return;

        const invalidateAll = () => {
            queryClient.invalidateQueries({ queryKey: ['active-locks'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['picker-picked'] });
            queryClient.invalidateQueries({ queryKey: ['dispatched-orders'] });
            queryClient.invalidateQueries({ queryKey: ['packer-packed'] });
            queryClient.invalidateQueries({ queryKey: ['dispatcher-order'] });
            queryClient.invalidateQueries({ queryKey: ['home-stats'] });
        };

        // Listen for all plausible server event names — covers new orders + updates
        const events = [
            // New order created (customer places order)
            'order_created',
            'order:created',
            'orderCreated',
            'new_order',
            'newOrder',
            // Order updates
            'order_update',
            'order_updated',
            'orderUpdate',
            'orders_updated',
            'order:update',
            'order:updated',
            // Lock events
            'lock_update',
            'lock_updated',
        ];

        const cleanups = events.map(e => on(e, invalidateAll)).filter(Boolean) as (() => void)[];

        const cleanupNotification = on('notification', (data: any) => {
            if (data?.type?.startsWith('orders.') || data?.type?.startsWith('order')) invalidateAll();
        });

        return () => {
            cleanups.forEach(c => c());
            if (cleanupNotification) cleanupNotification();
        };
    }, [on, isConnected, queryClient]);
}

/**
 * Fulfillment actions: claim, release, and extend lock.
 * Pass orderId at hook level to use as default, or override per call.
 */
export function useFulfillmentActions(orderId?: string) {
    const queryClient = useQueryClient();
    const addNotification = useNotificationStore((s) => s.addNotification);

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['active-locks'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['home-stats'] });
    };

    // ── Claim ─────────────────────────────────────────────────────────────────
    const { mutateAsync: claimMutation, isPending: isClaiming } = useMutation({
        mutationFn: (id: string) => fulfillmentApi.claim(id),
        onSuccess: () => {
            invalidate();
        },
        onError: (error) => {
            addNotification({ title: 'Unable to claim', message: toAppError(error).message, type: 'error' });
        },
    });

    // ── Release ───────────────────────────────────────────────────────────────
    const { mutateAsync: releaseMutation, isPending: isReleasing } = useMutation({
        mutationFn: (id: string) => fulfillmentApi.release(id),
        onSuccess: () => {
            invalidate();
        },
        onError: (error) => {
            addNotification({ title: 'Unable to release', message: toAppError(error).message, type: 'error' });
        },
    });

    // ── Extend ────────────────────────────────────────────────────────────────
    const { mutateAsync: extendMutation, isPending: isExtending } = useMutation({
        mutationFn: ({ id, minutes }: { id: string; minutes: ExtendMinutes }) =>
            fulfillmentApi.extend(id, minutes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-locks'] });
            addNotification({ title: 'Time extended', message: 'Lock duration updated.', type: 'success' });
        },
        onError: (error) => {
            addNotification({ title: 'Unable to extend', message: toAppError(error).message, type: 'error' });
        },
    });

    return {
        claim: (id?: string) => claimMutation(id ?? orderId!),
        release: (id?: string) => releaseMutation(id ?? orderId!),
        extend: (minutes: ExtendMinutes, id?: string) => extendMutation({ id: id ?? orderId!, minutes }),
        isClaiming,
        isReleasing,
        isExtending,
    };
}
