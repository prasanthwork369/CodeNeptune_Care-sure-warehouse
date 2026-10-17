import test from "node:test";
import assert from "node:assert/strict";
import { ApiOrder } from "@/src/features/picker/types/order.types";
import {
  getDispatchEventDate,
  isDispatchEventOn,
  isDispatchedOrder,
  isDispatchFailedOrder,
} from "../utils/dispatcherFilters";

const today = new Date(2026, 9, 15, 12);
const at = (day: number, hour = 10) => new Date(2026, 9, day, hour).toISOString();

const order = (overrides: Partial<ApiOrder>): ApiOrder => ({
  id: "o1",
  orderId: "CS_ORD_1",
  customerId: "c1",
  status: 6,
  paymentStatus: "PAID",
  deliveryType: "STANDARD",
  deliveryAddress: {
    city: "Chennai",
    line1: "1 Main St",
    state: "TN",
    country: "India",
    pincode: "600001",
  },
  total: "100",
  createdAt: at(10),
  customer: { firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: "9876543210" },
  items: [],
  ...overrides,
});

const dispatchedToday = (orders: ApiOrder[]) =>
  orders.filter((o) => isDispatchedOrder(o) && isDispatchEventOn(o, today));
const failedToday = (orders: ApiOrder[]) =>
  orders.filter((o) => isDispatchFailedOrder(o) && isDispatchEventOn(o, today));

test("order placed on an earlier day but shipped today shows in Dispatched Today", () => {
  const o = order({
    status: 6,
    createdAt: at(10),
    statusLogs: [
      { toStatus: 14, createdAt: at(14) },
      { toStatus: 6, createdAt: at(15, 9) },
    ],
  });
  assert.equal(dispatchedToday([o]).length, 1);
});

test("delivered order counts as Dispatched on the day it shipped, not the day delivered", () => {
  const shippedToday = order({
    status: 7,
    createdAt: at(12),
    statusLogs: [
      { toStatus: 6, createdAt: at(15, 8) },
      { toStatus: 7, createdAt: at(15, 18) },
    ],
  });
  const shippedYesterday = order({
    id: "o2",
    status: 7,
    createdAt: at(12),
    updatedAt: at(15, 18),
    statusLogs: [
      { toStatus: 6, createdAt: at(14, 8) },
      { toStatus: 7, createdAt: at(15, 18) },
    ],
  });
  assert.deepEqual(dispatchedToday([shippedToday, shippedYesterday]).map((o) => o.id), ["o1"]);
});

test("without status logs, falls back to updatedAt, then createdAt", () => {
  assert.equal(getDispatchEventDate(order({ updatedAt: at(15) })), at(15));
  assert.equal(getDispatchEventDate(order({ createdAt: at(15) })), at(15));
  assert.equal(dispatchedToday([order({ createdAt: at(10), updatedAt: at(15) })]).length, 1);
});

test("dispatch-failed orders use the DISPATCHER_CANCEL log and stay out of Dispatched", () => {
  const failed = order({
    status: "12" as any,
    createdAt: at(11),
    statusLogs: [{ toStatus: "12", createdAt: at(15, 11) }],
  });
  assert.equal(failedToday([failed]).length, 1);
  assert.equal(dispatchedToday([failed]).length, 0);
});

test("non-dispatcher statuses (e.g. PACKED, CHECKED) are in neither section", () => {
  const orders = [order({ status: 14, updatedAt: at(15) }), order({ status: 5, updatedAt: at(15) })];
  assert.equal(dispatchedToday(orders).length, 0);
  assert.equal(failedToday(orders).length, 0);
});

test("orders dispatched on an earlier day are excluded from today", () => {
  const o = order({ statusLogs: [{ toStatus: 6, createdAt: at(14) }], updatedAt: at(14) });
  assert.equal(dispatchedToday([o]).length, 0);
});

test("empty API response gives empty sections", () => {
  assert.equal(dispatchedToday([]).length, 0);
  assert.equal(failedToday([]).length, 0);
});
