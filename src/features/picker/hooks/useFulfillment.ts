import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fulfillmentApi } from '@/src/features/picker/api/fulfillment.api';
import { ExtendMinutes } from '@/src/features/picker/types/fulfillment.types';
import { toAppError } from "@/src/api/errors";
import { useNotificationStore } from "@/src/store/useNotificationStore";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useSocket } from "@/src/hooks/useSocket";

// Orders claimed during this JS session — never auto-released by the startup cleanup.
// Module-level so it resets on a full app reload, which is exactly the case we clean up after.
const sessionClaims = new Set<string>();
let staleLockCleanupDone = false;

/**
 * Releases stale locks left behind by this user when the app was killed or
 * reloaded mid-pick. Without this, the claimed order stays hidden from the
 * queue until the server lock expires (~10 min). Runs once per app launch,
 * as soon as the authenticated user is known.
 */
export function useReleaseStaleLocks() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!userId || staleLockCleanupDone) return;
    staleLockCleanupDone = true;
    (async () => {
      try {
        const locks = await fulfillmentApi.getActiveLocks();
        const stale = locks.filter(
          (l) => l.pickerId === userId && !sessionClaims.has(l.orderId),
        );
        if (!stale.length) return;
        await Promise.all(
          stale.map((l) => fulfillmentApi.release(l.orderId).catch(() => {})),
        );
        queryClient.invalidateQueries({ queryKey: ["active-locks"] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      } catch {
        // Network error — locks will expire naturally on the server
      }
    })();
  }, [userId, queryClient]);
}

/**
 * Fetches and tracks all active picker locks.
 * Polls every 30s as a fallback when sockets are unavailable.
 */
export function useActiveLocks() {
  return useQuery({
    queryKey: ["active-locks"],
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
      queryClient.invalidateQueries({ queryKey: ["active-locks"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["picker-picked"] });
      queryClient.invalidateQueries({ queryKey: ["dispatched-orders"] });
      queryClient.invalidateQueries({ queryKey: ["checker-packed"] });
      queryClient.invalidateQueries({ queryKey: ["dispatcher-order"] });
      queryClient.invalidateQueries({ queryKey: ["home-stats"] });
    };

    // Listen for all plausible server event names — covers new orders + updates
    const events = [
      // New order created (customer places order)
      "order_created",
      "order:created",
      "orderCreated",
      "new_order",
      "newOrder",
      // Order updates
      "order_update",
      "order_updated",
      "orderUpdate",
      "orders_updated",
      "order:update",
      "order:updated",
      // Lock events
      "lock_update",
      "lock_updated",
    ];

    const cleanups = events
      .map((e) => on(e, invalidateAll))
      .filter(Boolean) as (() => void)[];

    const cleanupNotification = on("notification", (data: any) => {
      if (data?.type?.startsWith("orders.") || data?.type?.startsWith("order"))
        invalidateAll();
    });

    return () => {
      cleanups.forEach((c) => c());
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
    queryClient.invalidateQueries({ queryKey: ["active-locks"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["home-stats"] });
  };

  // ── Claim ─────────────────────────────────────────────────────────────────
  const { mutateAsync: claimMutation, isPending: isClaiming } = useMutation({
    mutationFn: (id: string) => {
      sessionClaims.add(id); // guard against the startup cleanup releasing a live claim
      return fulfillmentApi.claim(id);
    },
    onSuccess: () => {
      invalidate();
    },
    onError: (error) => {
      addNotification({
        title: "Unable to claim",
        message: toAppError(error).message,
        type: "error",
      });
    },
  });

  // ── Release ───────────────────────────────────────────────────────────────
  const { mutateAsync: releaseMutation, isPending: isReleasing } = useMutation({
    mutationFn: (id: string) => fulfillmentApi.release(id),
    onMutate: async (id: string) => {
      // Optimistically drop the lock so the order reappears in the queue
      // immediately on back-navigation instead of waiting for the next poll
      await queryClient.cancelQueries({ queryKey: ["active-locks"] });
      queryClient.setQueryData<{ orderId: string }[]>(["active-locks"], (old) =>
        old?.filter((l) => l.orderId !== id),
      );
    },
    onSuccess: () => {
      invalidate();
    },
    onError: (error) => {
      addNotification({
        title: "Unable to release",
        message: toAppError(error).message,
        type: "error",
      });
    },
  });

  // ── Extend ────────────────────────────────────────────────────────────────
  const { mutateAsync: extendMutation, isPending: isExtending } = useMutation({
    mutationFn: ({ id, minutes }: { id: string; minutes: ExtendMinutes }) =>
      fulfillmentApi.extend(id, minutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-locks"] });
      addNotification({
        title: "Time extended",
        message: "Lock duration updated.",
        type: "success",
      });
    },
    onError: (error) => {
      addNotification({
        title: "Unable to extend",
        message: toAppError(error).message,
        type: "error",
      });
    },
  });

  return {
    claim: (id?: string) => claimMutation(id ?? orderId!),
    release: (id?: string) => releaseMutation(id ?? orderId!),
    extend: (minutes: ExtendMinutes, id?: string) =>
      extendMutation({ id: id ?? orderId!, minutes }),
    isClaiming,
    isReleasing,
    isExtending,
  };
}
