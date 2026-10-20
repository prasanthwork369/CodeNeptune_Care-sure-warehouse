import test from "node:test";
import assert from "node:assert/strict";
import { applyBatchSelection, isSystemAssignedRow } from "../batch.selection";
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
  const result = applyBatchSelection(rows, "2", stock("B2", 50));
  assert.deepEqual(result[0], rows[0]);
  assert.equal(result[1].batchNo, "B2");
});

test("selecting a batch keeps a quantity already entered", () => {
  const result = applyBatchSelection([row("2", "", "4")], "2", stock("B2", 50));
  assert.equal(result[0].quantity, "4");
});

test("selecting a batch fills an empty quantity from the batch stock", () => {
  const result = applyBatchSelection([row("2", "", "")], "2", stock("B2", 3));
  assert.equal(result[0].quantity, "3");
});

test("re-selecting replaces the previous batch number", () => {
  const result = applyBatchSelection(
    [row("2", "B2", "4")],
    "2",
    stock("B3", 9),
  );
  assert.equal(result[0].batchNo, "B3");
  assert.equal(result[0].quantity, "4");
});

test("quantity validation still applies after a dropdown selection", () => {
  // Ordered 10: system batch has 6, the dropdown batch defaults to its stock of 50
  const rows = applyBatchSelection(
    [row("1", "B1", "6"), row("2", "", "")],
    "2",
    stock("B2", 50),
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
