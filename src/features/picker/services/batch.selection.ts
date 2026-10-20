import { BatchRow, OrderItem } from "../types/order.types";
import { InventoryBatch } from "../api/inventory.api";
import { parseBatchQuantity } from "./batch.validation";

/**
 * The first row holds the batch the system assigned to the item; it is shown
 * read-only. Extra batches are added with "+ Add Batch" and picked from the
 * dropdown.
 */
export const isSystemAssignedRow = (
  index: number,
  item: Pick<OrderItem, "batchNo"> | null,
): boolean => index === 0 && !!item?.batchNo?.trim();

/**
 * Ordered units not yet allocated to the other rows — the most a row can hold
 * without the combined quantity exceeding the order.
 */
export const getRemainingQuantity = (
  rows: BatchRow[],
  orderedQty: number,
  excludeRowId?: string,
): number => {
  const allocated = rows
    .filter((r) => r.id !== excludeRowId)
    .reduce((sum, r) => sum + parseBatchQuantity(r.quantity), 0);
  return Math.max(0, orderedQty - allocated);
};

/**
 * Sets the chosen inventory batch on a row. A quantity already entered is
 * kept; an empty one defaults to the remaining ordered quantity, capped at the
 * batch's stock. It stays empty when nothing remains to allocate.
 */
export const applyBatchSelection = (
  rows: BatchRow[],
  rowId: string,
  batch: InventoryBatch,
  orderedQty: number,
): BatchRow[] => {
  const remaining = getRemainingQuantity(rows, orderedQty, rowId);
  const defaultQty = Math.min(remaining, Math.max(0, batch.quantity));
  return rows.map((r) =>
    r.id === rowId
      ? {
          ...r,
          batchNo: batch.batchNumber,
          quantity: r.quantity || (defaultQty > 0 ? defaultQty.toString() : ""),
        }
      : r,
  );
};

/**
 * Sets a row's typed quantity, capped so the total across all rows never
 * exceeds the ordered quantity.
 */
export const applyQuantityChange = (
  rows: BatchRow[],
  rowId: string,
  value: string,
  orderedQty: number,
): BatchRow[] => {
  const digits = value.replace(/[^0-9]/g, "");
  const remaining = getRemainingQuantity(rows, orderedQty, rowId);
  const quantity =
    digits && parseInt(digits, 10) > remaining
      ? remaining > 0
        ? remaining.toString()
        : ""
      : digits;
  return rows.map((r) => (r.id === rowId ? { ...r, quantity } : r));
};
