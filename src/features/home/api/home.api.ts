import { orderApi } from "@/src/features/picker/api/order.api";
import { StatsScope, WarehouseStat } from "../types/home";

// The server's default period is "today" in the server's time zone; send the
// device's local day instead so the cards match the staff member's own day.
// Computed per request so a fetch after midnight rolls over to the new day.
const localTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { fromDate: start.toISOString(), toDate: end.toISOString() };
};

export const homeApi = {
  getWarehouseStats: async (
    scope: StatsScope = "all",
  ): Promise<WarehouseStat[]> => {
    const response = await orderApi.getDashboardStats({
      scope,
      ...localTodayRange(),
    });
    const stats = response.data.data;

    return [
      {
        id: "picks",
        title: "Today's Picks",
        label: "Orders",
        gradient: ["#8A84FF", "#7D79DC"],
        illustration: "picks",
        badge: null,
        value: stats.todayPicks.orders,
        totalItems: stats.todayPicks.items,
        activeHours: stats.todayPicks.activeHours,
        itemsPerHr: stats.todayPicks.rate,
      },
      {
        id: "packs",
        title: "Today's Checks",
        label: "Orders",
        gradient: ["#F0948A", "#E36C61"],
        illustration: "packs",
        badge: null,
        value: stats.todayPacks.orders,
        totalItems: stats.todayPacks.items,
        activeHours: stats.todayPacks.activeHours,
        itemsPerHr: stats.todayPacks.rate,
      },
      {
        id: "dispatch",
        title: "Sent Out Today",
        label: "Orders",
        gradient: ["#609470", "#4B7D5B"],
        illustration: "dispatch",
        badge: null,
        value: stats.sentOutToday.orders,
        totalItems: stats.sentOutToday.items,
        activeHours: stats.sentOutToday.activeHours,
        itemsPerHr: 0,
      },
    ];
  },
};
