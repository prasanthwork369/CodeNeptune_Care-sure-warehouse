import type { QueryClient } from "@tanstack/react-query";

/**
 * Drops every cached query on logout. The profile query (["user"]) and the
 * stats/order queries are not keyed by user and stay fresh for 5 minutes, so
 * without this the next user to log in is served the previous user's data.
 */
export function clearSessionCache(queryClient: QueryClient) {
  queryClient.clear();
}
