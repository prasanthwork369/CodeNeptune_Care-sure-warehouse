export const LIVE = false;

const PROD_URL = 'https://care-sure-api-gateway.onrender.com';
const QA_URL = 'https://qa-csapi.codeneptune.com';

export const API_BASE_URL = LIVE ? PROD_URL : QA_URL;
export const SITE_URL = API_BASE_URL;
export const IMAGE_BASE_URL = API_BASE_URL;
export const API_TIMEOUT = __DEV__ ? 60_000 : 15_000;


export const API_ENDPOINTS = {
    // Auth
    AUTH_LOGIN: '/api/v1/auth/login',
    AUTH_REGISTER: '/api/v1/auth/register',
    AUTH_REFRESH: '/api/v1/auth/refresh',
    AUTH_LOGOUT: '/api/v1/auth/logout',
    AUTH_ME: '/api/v1/users/me',
    AUTH_UPDATE_PROFILE: '/api/v1/users',
    AUTH_UPLOAD_AVATAR: '/api/v1/storage/upload',
    GET_PICKER_QUEUE: '/api/v1/orders/staff/picker-queue',
    GET_PICKER_QUEUE_DETAILED: '/api/v1/orders/staff/picker-queue/detailed',
    GET_ORDER_BY_ID: (id: string) => `/api/v1/orders/staff/${id}`,
    UPDATE_ORDER_STATUS: (id: string) => `/api/v1/orders/staff/${id}/status`,

    // Fulfillment / Picking locks
    FULFILLMENT_PICK: (orderId: string) => `/api/v1/fulfillment/orders/${orderId}/pick`,
    FULFILLMENT_CLAIM: (orderId: string) => `/api/v1/fulfillment/orders/${orderId}/claim`,
    FULFILLMENT_RELEASE: (orderId: string) => `/api/v1/fulfillment/orders/${orderId}/release`,
    FULFILLMENT_EXTEND: (orderId: string) => `/api/v1/fulfillment/orders/${orderId}/extend`,
    FULFILLMENT_ACTIVE_LOCKS: '/api/v1/fulfillment/active-locks',

    // Inventory
    INVENTORY_BATCHES: '/api/v1/inventory/batches',

    // Packing
    FULFILLMENT_PACK: (orderId: string) => `/api/v1/fulfillment/orders/${orderId}/pack`,
    FULFILLMENT_QUALITY_CHECKS: (orderId: string) => `/api/v1/fulfillment/orders/${orderId}/quality-checks`,

    // Dispatcher
    DISPATCHER_DISPATCHED: '/api/v1/fulfillment/staff/dispatched',

    // Picker completed
    PICKER_PICKED: '/api/v1/fulfillment/staff/picked',

    // Packer packed
    PACKER_PACKED: '/api/v1/fulfillment/staff/packed',

    // Dashboard
    DASHBOARD_FULFILLMENT_STATS: '/api/v1/dashboard/fulfillment-stats',

    // Dispatcher
    DISPATCHER_QUEUE_BY_ID: (orderId: string) => `/api/v1/orders/staff/dispatcher-queue/${orderId}`,
    FULFILLMENT_DISPATCH: (orderId: string) => `/api/v1/fulfillment/orders/${orderId}/dispatch`,
    FULFILLMENT_REJECT_DISPATCH: (orderId: string) => `/api/v1/fulfillment/orders/${orderId}/reject-dispatch`,
}

const URLS = {
    SITE_URL,
    API_BASE_URL,
    IMAGE_BASE_URL,
    API_ENDPOINTS
};