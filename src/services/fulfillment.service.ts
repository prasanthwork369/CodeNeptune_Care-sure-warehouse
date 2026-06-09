import { fulfillmentApi } from '../api/fulfillment.api';
import { ExtendMinutes } from '../types/fulfillment.types';

export const fulfillmentService = {
    claim: (orderId: string) => fulfillmentApi.claim(orderId),
    release: (orderId: string) => fulfillmentApi.release(orderId),
    extend: (orderId: string, minutes: ExtendMinutes) => fulfillmentApi.extend(orderId, minutes),
    getActiveLocks: () => fulfillmentApi.getActiveLocks(),
};
