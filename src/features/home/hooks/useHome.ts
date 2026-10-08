import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { homeApi } from "../api/home.api";
import { StatsScope, WarehouseStat } from "../types/home";

// No polling: refreshed when Home gains focus (HomeLayout), on order/lock
// socket events and on socket reconnect (useSyncFulfillment). Home is a tab
// and stays mounted, so the query is only enabled while Home is focused —
// invalidations elsewhere just mark it stale instead of fetching stats nobody
// is looking at.
//
// Keyed per scope; the ["home-stats"] prefix used by refreshQueries still
// matches every scope. keepPreviousData keeps the cards on screen while a
// newly selected scope loads (isPlaceholderData is true until it arrives).
export const useHomeQuery = ({
  isFocused = true,
  scope = "warehouse",
}: { isFocused?: boolean; scope?: StatsScope } = {}) => {
  return useQuery<WarehouseStat[], Error>({
    queryKey: ["home-stats", scope],
    queryFn: () => homeApi.getWarehouseStats(scope),
    staleTime: 60_000,
    enabled: isFocused,
    placeholderData: keepPreviousData,
  });
};
