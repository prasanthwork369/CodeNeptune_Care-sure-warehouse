import { useQuery } from '@tanstack/react-query';
import { homeApi } from '../api/home.api';

export const useHomeQuery = () => {
  return useQuery({
    queryKey: ['home-stats'],
    queryFn: () => homeApi.getWarehouseStats(),
    staleTime: 60_000,
    refetchInterval: 30_000,
  });
};
