import test from "node:test";
import assert from "node:assert/strict";
import { isSameLocalDay } from "../dateUtils";

const today = new Date(2026, 9, 15, 12);

test("Checker Today includes an updatedAt on the same device-local day", () => {
  assert.equal(isSameLocalDay(new Date(2026, 9, 15, 1).toISOString(), today), true);
});

test("Checker Today excludes an updatedAt from yesterday", () => {
  assert.equal(isSameLocalDay(new Date(2026, 9, 14, 23, 59).toISOString(), today), false);
});

test("Checker Today excludes missing or invalid updatedAt values", () => {
  const matchesToday = (updatedAt?: string) =>
    updatedAt ? isSameLocalDay(updatedAt, today) : false;

  assert.equal(matchesToday(undefined), false);
  assert.equal(matchesToday("not-a-date"), false);
});
