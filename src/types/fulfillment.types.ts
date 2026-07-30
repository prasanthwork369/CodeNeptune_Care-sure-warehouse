export interface LockResult {
    expiresAt: string;
}

export interface ActiveLock {
    orderId: string;
    pickerId: string;
    ttl: number;
}

export type ExtendMinutes = '2' | '5';

export { FULFILLMENT_TYPE, FULFILLMENT_TYPE_LABELS, type FulfillmentTypeValue } from '../constants/order.constants';

