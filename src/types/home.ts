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
    illustration: 'picks' | 'packs' | 'dispatch';
}
