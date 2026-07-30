import { orderApi } from "./order.api";
import { WarehouseStat } from "../types/home";

export const homeApi = {
  getWarehouseStats: async (): Promise<WarehouseStat[]> => {
    const response = await orderApi.getDashboardStats();
    const stats = response.data.data;

    return [
      {
        id: "picks",
        title: "Today's Checks",
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
        title: "Today's Packs",
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
