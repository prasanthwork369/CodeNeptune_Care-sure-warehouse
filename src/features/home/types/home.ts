// Which work the dashboard counts: every warehouse, the user's assigned
// warehouse(s), or only the orders the user picked/packed/dispatched.
export type StatsScope = "all" | "warehouse" | "me";

export interface FulfillmentStats {
  todayPicks: {
    orders: number;
    items: number;
    activeHours: number;
    rate: number;
  };
  todayPacks: {
    orders: number;
    items: number;
    activeHours: number;
    rate: number;
  };
  sentOutToday: {
    orders: number;
    items: number;
    activeHours: number;
  };
}

export interface WarehouseStat {
  id: string;
  title: string;
  badge: string | null;
  value: number;
  label: string;
  itemsPerHr: number;
  activeHours: number;
  totalItems: number;
  gradient: [string, string];
  illustration: "picks" | "packs" | "dispatch";
}
