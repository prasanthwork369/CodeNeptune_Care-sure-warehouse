export interface LockResult {
    expiresAt: string;
}

export interface ActiveLock {
    orderId: string;
    pickerId: string;
    ttl: number;
}

export type ExtendMinutes = '2' | '5';
