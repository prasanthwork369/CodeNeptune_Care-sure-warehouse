export const ORDER_STATUS = {
  CANCELLED: 0,
  NEW: 1,                 // Awaiting Doctor Call/Review
  DOCTOR_APPROVED: 2,     // Awaiting Pharmacist Verification
  PHARMACIST_APPROVED: 3, // Awaiting Picker (Confirmed for Inventory)
  PICKED: 4,              // Awaiting Checking
  CHECKED: 5,             // Checker verified & boxed items — awaiting Packer hand-off
  SHIPPED: 6,             // In Transit
  DELIVERED: 7,           // Delivered to Customer
  CALLER_REVIEW: 8,       // Moved back to Caller for clarification
  PARTIALLY_PICKED: 9,    // Partially Picked (Shortage found)
  RETURNED_FROM_CALLER: 10, // Returned from Caller back to Doctor
  RETURNED_FROM_PHARMACIST: 11, // Returned from Pharmacist back to Doctor
  DISPATCHER_CANCEL: 12,   // Dispatch Rejected/Cancelled
  DRAFT: 13,               // Draft saved
  PACKED: 14,              // Packer confirmed hand-off — awaiting Shipment
} as const;

export type OrderStatusValue = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  [ORDER_STATUS.NEW]: 'NEW',
  [ORDER_STATUS.CANCELLED]: 'CANCELLED',
  [ORDER_STATUS.DOCTOR_APPROVED]: 'DOCTOR APPROVED',
  [ORDER_STATUS.PHARMACIST_APPROVED]: 'PHARMACIST APPROVED',
  [ORDER_STATUS.PICKED]: 'PICKED',
  [ORDER_STATUS.CHECKED]: 'CHECKED',
  [ORDER_STATUS.PACKED]: 'PACKED',
  [ORDER_STATUS.SHIPPED]: 'SHIPPED',
  [ORDER_STATUS.DELIVERED]: 'DELIVERED',
  [ORDER_STATUS.CALLER_REVIEW]: 'CALLER REVIEW',
  [ORDER_STATUS.PARTIALLY_PICKED]: 'PARTIALLY PICKED',
  [ORDER_STATUS.RETURNED_FROM_CALLER]: 'RETURNED FROM CALLER',
  [ORDER_STATUS.RETURNED_FROM_PHARMACIST]: 'RETURNED FROM PHARMACIST',
  [ORDER_STATUS.DISPATCHER_CANCEL]: 'DISPATCH CANCELLED',
  [ORDER_STATUS.DRAFT]: 'DRAFT',
};

/**
 * Item Fulfillment Type Status Codes
 * 1: USED_FROM_STOCK (Deducted from physical warehouse stock)
 * 2: ON_DEMAND_PROCUREMENT (Stock is 0 or batch expired — sourced on demand)
 */
export const FULFILLMENT_TYPE = {
  USED_FROM_STOCK: 1,
  ON_DEMAND_PROCUREMENT: 2,
} as const;

export type FulfillmentTypeValue =
  (typeof FULFILLMENT_TYPE)[keyof typeof FULFILLMENT_TYPE];

/**
 * Human-readable Display Labels
 */
export const FULFILLMENT_TYPE_LABELS: Record<FulfillmentTypeValue, string> = {
  [FULFILLMENT_TYPE.USED_FROM_STOCK]: "USED FROM STOCK",
  [FULFILLMENT_TYPE.ON_DEMAND_PROCUREMENT]: "ON DEMAND PROCUREMENT",
};
