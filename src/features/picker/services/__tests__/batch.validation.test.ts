import test from "node:test";
import assert from "node:assert/strict";
import {
  getBatchTotal,
  validateBatches,
  findOverPickedItems,
} from "../batch.validation";
import { BatchRow } from "../../types/order.types";

const row = (id: string, batchNo: string, quantity: string): BatchRow => ({
  id,
  batchNo,
  quantity,
});

test("D_ID_11: combined batch quantity above ordered quantity is rejected", () => {
  // Ordered 10: first row pre-filled with 10, picker adds a second batch of 5
  const result = validateBatches([row("1", "B1", "10"), row("2", "B2", "5")], 10);
  assert.equal(result.isValid, false);
  assert.equal(result.error, "EXCEEDS_ORDERED");
  assert.equal(result.total, 15);
});

test("D_ID_11: total is summed across every batch row, not just the first", () => {
  const result = validateBatches(
    [row("1", "B1", "4"), row("2", "B2", "4"), row("3", "B3", "4")],
    10,
  );
  assert.equal(result.isValid, false);
  assert.equal(result.error, "EXCEEDS_ORDERED");
  assert.equal(result.total, 12);
});

test("valid multi-batch allocation equal to ordered quantity is accepted", () => {
  const result = validateBatches(
    [row("1", "B1", "6"), row("2", "B2", "3"), row("3", "B3", "1")],
    10,
  );
  assert.deepEqual(result, { isValid: true, total: 10 });
});

test("multi-batch allocation below ordered quantity is accepted (partial pick)", () => {
  const result = validateBatches([row("1", "B1", "3"), row("2", "B2", "2")], 10);
  assert.deepEqual(result, { isValid: true, total: 5 });
});

test("single batch matching ordered quantity is accepted", () => {
  assert.deepEqual(validateBatches([row("1", "B1", "10")], 10), {
    isValid: true,
    total: 10,
  });
});

test("single batch above ordered quantity is rejected", () => {
  const result = validateBatches([row("1", "B1", "11")], 10);
  assert.equal(result.isValid, false);
  assert.equal(result.error, "EXCEEDS_ORDERED");
});

test("missing batch number or zero/empty quantity is still rejected", () => {
  assert.equal(
    validateBatches([row("1", "  ", "5")], 10).error,
    "MISSING_BATCH_NO",
  );
  assert.equal(
    validateBatches([row("1", "B1", "5"), row("2", "B2", "")], 10).error,
    "INVALID_QUANTITY",
  );
  assert.equal(
    validateBatches([row("1", "B1", "0")], 10).error,
    "INVALID_QUANTITY",
  );
});

test("getBatchTotal ignores empty and non-numeric quantities", () => {
  assert.equal(
    getBatchTotal([row("1", "B1", "7"), row("2", "B2", ""), row("3", "B3", "x")]),
    7,
  );
});

test("findOverPickedItems flags only items picked above ordered quantity", () => {
  const ids = findOverPickedItems([
    { id: "a", requiredQty: 10, pickedQty: 15 },
    { id: "b", requiredQty: 10, pickedQty: 10 },
    { id: "c", requiredQty: 10, pickedQty: 4 },
    { id: "d", requiredQty: 5 },
  ]);
  assert.deepEqual(ids, ["a"]);
});
