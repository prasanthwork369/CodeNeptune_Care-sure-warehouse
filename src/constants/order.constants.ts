export const ORDER_STATUS = {
  CANCELLED: 0,
  NEW: 1,                 // Awaiting Doctor Call/Review
  DOCTOR_APPROVED: 2,     // Awaiting Pharmacist Verification
  PHARMACIST_APPROVED: 3, // Awaiting Picker (Confirmed for Inventory)
  PICKED: 4,              // Awaiting Packing
  PACKED: 5,              // Awaiting Shipment
  SHIPPED: 6,             // In Transit
  DELIVERED: 7,           // Delivered to Customer
  CALLER_REVIEW: 8,       // Moved back to Caller for clarification
  PARTIALLY_PICKED: 9,    // Partially picked, awaiting resolution
  READY_FOR_DISPATCH: 12, // Packed and awaiting dispatcher
} as const;

export type OrderStatusValue = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
