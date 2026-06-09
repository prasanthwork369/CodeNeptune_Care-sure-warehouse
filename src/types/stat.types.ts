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
