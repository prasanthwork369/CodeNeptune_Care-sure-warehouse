import type { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * Invalidate + refetch queries matching `queryKey` without ever running two
 * requests for the same query at once.
 *
 * React Query's default (`cancelRefetch: true`) abandons an in-flight fetch and
 * starts a new one — but our API calls don't take an AbortSignal, so the
 * abandoned request still hits the server and both overlap. Instead:
 * - nothing in flight → fetch now;
 * - already in flight → join it (it may predate the change being reacted to),
 *   then refetch once when it settles. Concurrent callers share that one
 *   follow-up, so a burst of triggers costs at most two sequential requests
 *   and the last one always starts after the latest trigger.
 */
export function refreshQueries(queryClient: QueryClient, queryKey: QueryKey) {
  return Promise.all(
    queryClient
      .getQueryCache()
      .findAll({ queryKey })
      .map((query) => {
        const refresh = () =>
          queryClient.invalidateQueries(
            { queryKey: query.queryKey, exact: true },
            { cancelRefetch: false },
          );
        return query.state.fetchStatus === "fetching"
          ? refresh().then(refresh)
          : refresh();
      }),
  );
}
