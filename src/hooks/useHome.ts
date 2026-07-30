import { useQuery } from "@tanstack/react-query";
import { homeApi } from "../api/home.api";
import { WarehouseStat } from "../types/home";

export const useHomeQuery = () => {
  return useQuery<WarehouseStat[], Error>({
    queryKey: ["home-stats"],
    queryFn: () => homeApi.getWarehouseStats(),
    staleTime: 60_000,
    refetchInterval: 30_000,
  });
};
