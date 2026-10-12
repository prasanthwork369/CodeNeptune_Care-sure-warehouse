import type { QueryClient } from "@tanstack/react-query";
import { refreshQueries } from "@/src/lib/refreshQueries";

// Queries kept fresh by socket events (and resynced after a reconnect).
// Keys match by prefix element, so "checker-packed" does NOT cover
// "checker-packed-today" — each key must be listed separately.
export const SYNCED_QUERY_KEYS = [
  "active-locks",
  "orders",
  "picker-picked",
  "dispatched-orders",
  "checker-packed",
  "checker-packed-today",
  "dispatcher-order",
  "home-stats",
];

export const refreshSyncedQueries = (queryClient: QueryClient) =>
  Promise.all(
    SYNCED_QUERY_KEYS.map((key) => refreshQueries(queryClient, [key])),
  );

// Listen for all plausible server event names — covers new orders + updates
export const FULFILLMENT_EVENTS = [
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

type On = (
  event: string,
  callback: (...args: any[]) => void,
) => (() => void) | undefined;

/**
 * Subscribes `onSync` to every fulfillment event (plus order-type
 * notifications) and returns a cleanup that removes exactly those listeners.
 */
export function subscribeFulfillmentEvents(on: On, onSync: () => void) {
  const cleanups = FULFILLMENT_EVENTS.map((e) => on(e, onSync)).filter(
    Boolean,
  ) as (() => void)[];

  const cleanupNotification = on("notification", (data: any) => {
    if (data?.type?.startsWith("orders.") || data?.type?.startsWith("order"))
      onSync();
  });

  return () => {
    cleanups.forEach((c) => c());
    if (cleanupNotification) cleanupNotification();
  };
}
