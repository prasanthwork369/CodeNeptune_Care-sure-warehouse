import { BatchRow, OrderItem } from "../types/order.types";
import { InventoryBatch } from "../api/inventory.api";

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
 * Sets the chosen inventory batch on a row. A quantity already entered is
 * kept; an empty one defaults to the batch's stock quantity.
 */
export const applyBatchSelection = (
  rows: BatchRow[],
  rowId: string,
  batch: InventoryBatch,
): BatchRow[] =>
  rows.map((r) =>
    r.id === rowId
      ? {
          ...r,
          batchNo: batch.batchNumber,
          quantity: r.quantity || batch.quantity.toString(),
        }
      : r,
  );
