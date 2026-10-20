import test from "node:test";
import assert from "node:assert/strict";
import {
  applyBatchSelection,
  applyQuantityChange,
  getRemainingQuantity,
  isSystemAssignedRow,
} from "../batch.selection";
import { validateBatches } from "../batch.validation";
import { BatchRow } from "../../types/order.types";
import { InventoryBatch } from "../../api/inventory.api";

const row = (id: string, batchNo: string, quantity: string): BatchRow => ({
  id,
  batchNo,
  quantity,
});

const stock = (batchNumber: string, quantity: number): InventoryBatch => ({
  id: `inv-${batchNumber}`,
  batchNumber,
  quantity,
  expiryDate: "2027-03-31",
});

test("first row is read-only when the system assigned a batch", () => {
  assert.equal(isSystemAssignedRow(0, { batchNo: "B1" }), true);
});

test("added rows are never read-only", () => {
  assert.equal(isSystemAssignedRow(1, { batchNo: "B1" }), false);
  assert.equal(isSystemAssignedRow(2, { batchNo: "B1" }), false);
});

test("first row uses the dropdown when no batch was assigned", () => {
  assert.equal(isSystemAssignedRow(0, { batchNo: "" }), false);
  assert.equal(isSystemAssignedRow(0, { batchNo: "   " }), false);
  assert.equal(isSystemAssignedRow(0, { batchNo: undefined }), false);
  assert.equal(isSystemAssignedRow(0, null), false);
});

test("selecting a batch sets the inventory batch number on that row only", () => {
  const rows = [row("1", "B1", "6"), row("2", "", "")];
  const result = applyBatchSelection(rows, "2", stock("B2", 50), 10);
  assert.deepEqual(result[0], rows[0]);
  assert.equal(result[1].batchNo, "B2");
});

test("selecting a batch keeps a quantity already entered", () => {
  const result = applyBatchSelection(
    [row("2", "", "4")],
    "2",
    stock("B2", 50),
    10,
  );
  assert.equal(result[0].quantity, "4");
});

test("selecting a batch caps the default quantity at the batch stock", () => {
  // Ordered 10 but the batch only holds 3
  const result = applyBatchSelection(
    [row("2", "", "")],
    "2",
    stock("B2", 3),
    10,
  );
  assert.equal(result[0].quantity, "3");
});

test("re-selecting replaces the previous batch number", () => {
  const result = applyBatchSelection(
    [row("2", "B2", "4")],
    "2",
    stock("B3", 9),
    10,
  );
  assert.equal(result[0].batchNo, "B3");
  assert.equal(result[0].quantity, "4");
});

test("quantity validation still applies to a quantity entered before selection", () => {
  // Ordered 10: system batch has 6, the added row was given 8 before picking
  const rows = applyBatchSelection(
    [row("1", "B1", "6"), row("2", "", "8")],
    "2",
    stock("B2", 50),
    10,
  );
  const result = validateBatches(rows, 10);
  assert.equal(result.isValid, false);
  assert.equal(result.error, "EXCEEDS_ORDERED");
});

test("an added row with no batch selected cannot be saved", () => {
  const result = validateBatches([row("1", "B1", "6"), row("2", "", "4")], 10);
  assert.equal(result.isValid, false);
  assert.equal(result.error, "MISSING_BATCH_NO");
});

// Regression: ordered 3, batch stock 1000 — selection used to fill in 1000

test("ordered 3 with stock 1000: an empty row defaults to 3, not the stock", () => {
  const result = applyBatchSelection(
    [row("1", "", "")],
    "1",
    stock("AUTO-1", 1000),
    3,
  );
  assert.equal(result[0].quantity, "3");
  assert.deepEqual(validateBatches(result, 3), { isValid: true, total: 3 });
});

test("ordered 3 with stock 1000: cleared system row leaves 3 for the added batch", () => {
  // The reported case: system row emptied, second row picks the same batch
  const result = applyBatchSelection(
    [row("1", "AUTO-1", ""), row("2", "", "")],
    "2",
    stock("AUTO-1", 1000),
    3,
  );
  assert.equal(result[1].quantity, "3");
  assert.equal(validateBatches(result, 3).total, 3);
});

test("adding a batch defaults to the quantity still remaining", () => {
  // Ordered 10: system batch holds 6, so the added batch gets 4
  const result = applyBatchSelection(
    [row("1", "B1", "6"), row("2", "", "")],
    "2",
    stock("B2", 1000),
    10,
  );
  assert.equal(result[1].quantity, "4");
  assert.deepEqual(validateBatches(result, 10), { isValid: true, total: 10 });
});

test("multiple batches: each added batch gets what the earlier rows left", () => {
  // Ordered 10: B1 has 5, B2 stock is only 3, B3 takes the last 2
  let rows = [row("1", "B1", "5"), row("2", "", ""), row("3", "", "")];
  rows = applyBatchSelection(rows, "2", stock("B2", 3), 10);
  rows = applyBatchSelection(rows, "3", stock("B3", 1000), 10);
  assert.deepEqual(
    rows.map((r) => r.quantity),
    ["5", "3", "2"],
  );
  assert.deepEqual(validateBatches(rows, 10), { isValid: true, total: 10 });
});

test("adding a batch when the order is fully allocated leaves the quantity empty", () => {
  const result = applyBatchSelection(
    [row("1", "B1", "3"), row("2", "", "")],
    "2",
    stock("B2", 1000),
    3,
  );
  assert.equal(result[1].quantity, "");
  // Save stays blocked until the row is given a quantity or removed
  assert.equal(validateBatches(result, 3).error, "INVALID_QUANTITY");
});

test("remaining quantity excludes the row being edited", () => {
  const rows = [row("1", "B1", "2"), row("2", "B2", "1")];
  assert.equal(getRemainingQuantity(rows, 3), 0);
  assert.equal(getRemainingQuantity(rows, 3, "2"), 1);
  assert.equal(getRemainingQuantity([row("1", "B1", "5")], 3), 0);
});

test("typing a quantity above the remaining units is capped", () => {
  const rows = [row("1", "B1", "1"), row("2", "B2", "")];
  const result = applyQuantityChange(rows, "2", "1000", 3);
  assert.equal(result[1].quantity, "2");
  assert.equal(validateBatches(result, 3).isValid, true);
});

test("typing into a row cannot over-allocate when nothing remains", () => {
  const rows = [row("1", "B1", "3"), row("2", "B2", "")];
  const result = applyQuantityChange(rows, "2", "5", 3);
  assert.equal(result[1].quantity, "");
  assert.equal(getRemainingQuantity(result, 3), 0);
});

test("typing a quantity within the remaining units is kept as entered", () => {
  const rows = [row("1", "B1", ""), row("2", "B2", "1")];
  assert.equal(applyQuantityChange(rows, "1", "2", 3)[0].quantity, "2");
  // Partial picks (shortage) below the ordered quantity are still allowed
  assert.equal(applyQuantityChange(rows, "1", "1", 3)[0].quantity, "1");
  assert.equal(applyQuantityChange(rows, "1", "", 3)[0].quantity, "");
});

test("typed quantities are stripped to digits", () => {
  const result = applyQuantityChange([row("1", "B1", "")], "1", "2a-", 3);
  assert.equal(result[0].quantity, "2");
});
