import { homeApi } from "../api/home.api";
import { useHomeStore } from "../store/useHomeStore";
import { StatsScope } from "../types/home";

export const homeService = {
  fetchStats: async (scope: StatsScope = "all") => {
    try {
      const data = await homeApi.getWarehouseStats(scope);
      useHomeStore.getState().setStats(data);
      return data;
    } catch (error) {
      if (__DEV__) console.error("homeService.fetchStats failed:", error);
      throw error;
    }
  },
};
