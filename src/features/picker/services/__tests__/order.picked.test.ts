import test from "node:test";
import assert from "node:assert/strict";
import { mapOrder } from "../order.mapper";
import { ApiOrder } from "../../types/order.types";
import { formatOrderDate } from "../../../../utils/dateUtils";

const baseApiOrder: ApiOrder = {
  id: "order-123",
  orderId: "CS_ORD_001",
  customerId: "cust-1",
  status: 4,
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
  updatedAt: "2026-10-08T04:50:00.000Z",
  customer: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "9876543210",
  },
  items: [
    {
      id: "item-1",
      medicineId: "med-1",
      medicineSnapshot: {
        name: "Paracetamol 500mg",
        slug: "paracetamol-500mg",
        requiresPrescription: false,
      },
      quantity: 2,
      status: "picked",
    },
  ],
};

test("1. Real PICKED status log renders all real API values", () => {
  const apiOrder: ApiOrder = {
    ...baseApiOrder,
    status: 4,
    statusLogs: [
      {
        fromStatus: 3,
        toStatus: "4",
        reason: "Items fully picked successfully",
        createdAt: "2026-10-08T04:45:33.457Z",
        performedByFirstName: "kanna",
        performedByLastName: "N",
        performedByRole: "DISPATCHER",
      },
    ],
  };

  const order = mapOrder(apiOrder);

  assert.equal(order.pickedBy, "kanna N");
  assert.equal(order.pickedReason, "Items fully picked successfully");
  assert.equal(order.pickedByRole, "DISPATCHER");
  assert.equal(order.pickedAt, "2026-10-08T04:45:33.457Z");
  assert.deepEqual(order.pickedEvent, {
    createdAt: "2026-10-08T04:45:33.457Z",
    reason: "Items fully picked successfully",
    performedByFirstName: "kanna",
    performedByLastName: "N",
    performedByRole: "DISPATCHER",
  });
});

test("2. Picked event uses the API timestamp for completionDate and pickedAt", () => {
  const apiOrder: ApiOrder = {
    ...baseApiOrder,
    createdAt: "2026-10-01T00:00:00.000Z", // order created long ago
    updatedAt: "2026-10-08T05:00:00.000Z", // latest order update
    statusLogs: [
      {
        fromStatus: 3,
        toStatus: 4,
        reason: "Items fully picked successfully",
        createdAt: "2026-10-08T04:45:33.457Z",
        performedByFirstName: "kanna",
        performedByLastName: "N",
        performedByRole: "DISPATCHER",
      },
    ],
  };

  const order = mapOrder(apiOrder);

  // Must use statusLog createdAt, NOT apiOrder.createdAt or apiOrder.updatedAt
  assert.equal(order.pickedAt, "2026-10-08T04:45:33.457Z");
  assert.equal(
    order.completionDate,
    formatOrderDate("2026-10-08T04:45:33.457Z"),
  );
  assert.notEqual(
    order.completionDate,
    formatOrderDate(apiOrder.createdAt),
  );
  assert.notEqual(
    order.completionDate,
    formatOrderDate(apiOrder.updatedAt!),
  );
});

test("3. Picked event uses the API performer and handles missing optional name/role fields safely", () => {
  // First and last name present
  const orderWithName = mapOrder({
    ...baseApiOrder,
    statusLogs: [
      {
        fromStatus: 3,
        toStatus: "4",
        createdAt: "2026-10-08T04:45:33.457Z",
        performedByFirstName: "kanna",
        performedByLastName: "N",
        performedByRole: "DISPATCHER",
      },
    ],
  });
  assert.equal(orderWithName.pickedBy, "kanna N");

  // Only first name present
  const orderFirstOnly = mapOrder({
    ...baseApiOrder,
    statusLogs: [
      {
        fromStatus: 3,
        toStatus: "4",
        createdAt: "2026-10-08T04:45:33.457Z",
        performedByFirstName: "kanna",
      },
    ],
  });
  assert.equal(orderFirstOnly.pickedBy, "kanna");

  // Names missing but role present: fallback to role
  const orderRoleOnly = mapOrder({
    ...baseApiOrder,
    statusLogs: [
      {
        fromStatus: 3,
        toStatus: "4",
        createdAt: "2026-10-08T04:45:33.457Z",
        performedByRole: "DISPATCHER",
      },
    ],
  });
  assert.equal(orderRoleOnly.pickedBy, "DISPATCHER");

  // All performer fields missing: undefined (UI renders "—")
  const orderNoPerformer = mapOrder({
    ...baseApiOrder,
    statusLogs: [
      {
        fromStatus: 3,
        toStatus: "4",
        createdAt: "2026-10-08T04:45:33.457Z",
      },
    ],
  });
  assert.equal(orderNoPerformer.pickedBy, undefined);
});

test("4. No PICKED log does not render fake Picked data", () => {
  // Empty statusLogs
  const orderEmptyLogs = mapOrder({
    ...baseApiOrder,
    status: 1, // NEW
    statusLogs: [],
  });
  assert.equal(orderEmptyLogs.pickedBy, undefined);
  assert.equal(orderEmptyLogs.completionDate, undefined);
  assert.equal(orderEmptyLogs.pickedEvent, undefined);

  // statusLogs with other transitions but NO PICKED (toStatus === 4)
  const orderOtherLogs = mapOrder({
    ...baseApiOrder,
    status: 3, // PHARMACIST_APPROVED
    statusLogs: [
      {
        fromStatus: 1,
        toStatus: 2,
        createdAt: "2026-10-08T03:30:00.000Z",
        performedByFirstName: "Dr.",
        performedByLastName: "Smith",
        performedByRole: "DOCTOR",
      },
      {
        fromStatus: 2,
        toStatus: 3,
        createdAt: "2026-10-08T04:00:00.000Z",
        performedByFirstName: "Pharm.",
        performedByLastName: "Jones",
        performedByRole: "PHARMACIST",
      },
    ],
  });
  assert.equal(orderOtherLogs.pickedBy, undefined);
  assert.equal(orderOtherLogs.completionDate, undefined);
  assert.equal(orderOtherLogs.pickedEvent, undefined);
});

test("5. PICKED remains visible even when the latest status is CHECKED (status 5)", () => {
  const apiOrder: ApiOrder = {
    ...baseApiOrder,
    status: 5, // CHECKED
    statusLogs: [
      {
        fromStatus: 3,
        toStatus: "4",
        reason: "Items fully picked successfully",
        createdAt: "2026-10-08T04:45:33.457Z",
        performedByFirstName: "kanna",
        performedByLastName: "N",
        performedByRole: "DISPATCHER",
      },
      {
        fromStatus: 4,
        toStatus: 5,
        reason: "Items checked and verified",
        createdAt: "2026-10-08T05:10:00.000Z",
        performedByFirstName: "raj",
        performedByLastName: "K",
        performedByRole: "CHECKER",
      },
    ],
  };

  const order = mapOrder(apiOrder);

  // Picked information is derived from the historical 3 -> 4 log, not the latest 4 -> 5 log
  assert.equal(order.pickedBy, "kanna N");
  assert.equal(order.pickedAt, "2026-10-08T04:45:33.457Z");
  assert.equal(order.pickedReason, "Items fully picked successfully");
  assert.equal(order.pickedByRole, "DISPATCHER");
  assert.equal(
    order.completionDate,
    formatOrderDate("2026-10-08T04:45:33.457Z"),
  );

  // Status 5 is CHECKED, not PACKED
  assert.notEqual(order.status, "completed");
});
