import { useQuery } from "@tanstack/react-query";
import { homeApi } from "../api/home.api";
import { WarehouseStat } from "../types/home";

// No polling: refreshed when Home gains focus (HomeLayout), on order/lock
// socket events and on socket reconnect (useSyncFulfillment). Home is a tab
// and stays mounted, so the query is only enabled while Home is focused —
// invalidations elsewhere just mark it stale instead of fetching stats nobody
// is looking at.
export const useHomeQuery = ({
  isFocused = true,
}: { isFocused?: boolean } = {}) => {
  return useQuery<WarehouseStat[], Error>({
    queryKey: ["home-stats"],
    queryFn: () => homeApi.getWarehouseStats(),
    staleTime: 60_000,
    enabled: isFocused,
  });
};
