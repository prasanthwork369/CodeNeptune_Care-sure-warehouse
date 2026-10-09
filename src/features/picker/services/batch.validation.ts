import { BatchRow } from "../types/order.types";

export type BatchValidationError =
  | "MISSING_BATCH_NO"
  | "INVALID_QUANTITY"
  | "EXCEEDS_ORDERED";

export interface BatchValidationResult {
  isValid: boolean;
  total: number;
  error?: BatchValidationError;
}

export const parseBatchQuantity = (quantity: string): number => {
  const value = parseInt(quantity || "0", 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

export const getBatchTotal = (batches: BatchRow[]): number =>
  batches.reduce((sum, b) => sum + parseBatchQuantity(b.quantity), 0);

/**
 * Validates batch rows for one order item. Every row needs a batch number and
 * a positive quantity, and the combined quantity across all rows must not
 * exceed the ordered quantity.
 */
export const validateBatches = (
  batches: BatchRow[],
  orderedQty: number,
): BatchValidationResult => {
  const total = getBatchTotal(batches);

  if (batches.some((b) => b.batchNo.trim().length === 0)) {
    return { isValid: false, total, error: "MISSING_BATCH_NO" };
  }
  if (batches.some((b) => parseBatchQuantity(b.quantity) <= 0)) {
    return { isValid: false, total, error: "INVALID_QUANTITY" };
  }
  if (total > orderedQty) {
    return { isValid: false, total, error: "EXCEEDS_ORDERED" };
  }
  return { isValid: true, total };
};

/** Ids of items whose picked quantity is above the ordered quantity. */
export const findOverPickedItems = (
  items: { id: string; requiredQty: number; pickedQty?: number }[],
): string[] =>
  items
    .filter((i) => (i.pickedQty ?? i.requiredQty) > i.requiredQty)
    .map((i) => i.id);
