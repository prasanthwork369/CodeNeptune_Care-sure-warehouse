export const ORDER_STATUS = {
  CANCELLED: 0,
  NEW: 1, // Awaiting Doctor Call/Review
  DOCTOR_APPROVED: 2, // Awaiting Pharmacist Verification
  PHARMACIST_APPROVED: 3, // Awaiting Picker (Confirmed for Inventory)
  PICKED: 4, // Awaiting Packing
  PACKED: 5, // Awaiting Shipment
  SHIPPED: 6, // In Transit
  DELIVERED: 7, // Delivered to Customer
  CALLER_REVIEW: 8, // Moved back to Caller for clarification
  PARTIALLY_PICKED: 9, // Partially picked, awaiting resolution
  READY_FOR_DISPATCH: 12, // Packed and awaiting dispatcher
} as const;

export type OrderStatusValue = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

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
