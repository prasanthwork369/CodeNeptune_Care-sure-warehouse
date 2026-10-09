import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDeliveryDateLabel, mapOrder } from "../order.mapper";
import { ApiOrder, Order } from "../../types/order.types";

const apiOrder: ApiOrder = {
  id: "order-123",
  orderId: "CS_ORD_001",
  customerId: "cust-1",
  status: 3,
  paymentStatus: "PAID",
  deliveryType: "STANDARD",
  deliveryAddress: {
    city: "Chennai",
    line1: "123 Main St",
    state: "TN",
    country: "India",
    pincode: "600001",
  },
  total: "500",
  createdAt: "2026-10-08T03:00:00.000Z",
  customer: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "9876543210",
  },
  items: [],
};

test("D_ID_02: mapped order without an API delivery date shows N/A, not a fake date", () => {
  const order = mapOrder(apiOrder);
  assert.equal(order.deliveryDate, undefined);
  assert.equal(getDeliveryDateLabel(order), "N/A");
});

test("D_ID_02: delivery date label never falls back to the old hardcoded value", () => {
  assert.notEqual(getDeliveryDateLabel(mapOrder(apiOrder)), "Oct 14, 2023");
  assert.equal(getDeliveryDateLabel(null), "N/A");
  assert.equal(getDeliveryDateLabel(undefined), "N/A");
});

test("D_ID_02: a delivery date present on the order is shown as-is", () => {
  const order: Order = { id: "o1", status: "new", deliveryDate: "Oct 12, 09:30 AM" };
  assert.equal(getDeliveryDateLabel(order), "Oct 12, 09:30 AM");
});

test("D_ID_02: info popup Delivery Date row is not a hardcoded string literal", () => {
  const source = readFileSync(
    join(__dirname, "../../components/OrderInfoPopup.tsx"),
    "utf8",
  );
  const row = source.slice(source.indexOf('label="Delivery Date"'));
  assert.match(row, /value=\{getDeliveryDateLabel\(order\)\}/);
  assert.doesNotMatch(source, /Oct 14, 2023/);
});
