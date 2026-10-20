import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ORDER_STATUS } from "@/src/features/picker/constants/order.constants";
import { mapOrder } from "@/src/features/picker/services/order.mapper";
import { ApiOrder } from "@/src/features/picker/types/order.types";
import { isOrderAlreadyChecked } from "../utils/checkerStatus";

const baseApiOrder: ApiOrder = {
  id: "order-test-1",
  orderId: "CS_ORD_TEST",
  customerId: "cust-test",
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
  customer: {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "9876543210",
  },
  items: [],
};

test("1. isOrderAlreadyChecked returns true for rawStatus 5 (ORDER_STATUS.CHECKED)", () => {
  assert.equal(
    isOrderAlreadyChecked({ rawStatus: ORDER_STATUS.CHECKED }),
    true,
  );
  assert.equal(isOrderAlreadyChecked({ rawStatus: 5 }), true);
});

test("2. isOrderAlreadyChecked returns false for other order statuses", () => {
  // Not yet checked / other workflow states
  assert.equal(isOrderAlreadyChecked({ rawStatus: ORDER_STATUS.NEW }), false);
  assert.equal(
    isOrderAlreadyChecked({ rawStatus: ORDER_STATUS.DOCTOR_APPROVED }),
    false,
  );
  assert.equal(
    isOrderAlreadyChecked({ rawStatus: ORDER_STATUS.PHARMACIST_APPROVED }),
    false,
  );
  assert.equal(
    isOrderAlreadyChecked({ rawStatus: ORDER_STATUS.PICKED }),
    false,
  );
  assert.equal(
    isOrderAlreadyChecked({ rawStatus: ORDER_STATUS.PARTIALLY_PICKED }),
    false,
  );
  assert.equal(
    isOrderAlreadyChecked({ rawStatus: ORDER_STATUS.PACKED }),
    false,
  );
  assert.equal(
    isOrderAlreadyChecked({ rawStatus: ORDER_STATUS.CANCELLED }),
    false,
  );
  assert.equal(isOrderAlreadyChecked(null), false);
  assert.equal(isOrderAlreadyChecked(undefined), false);
});

test("3. isOrderAlreadyChecked checks statusLogs fallback when rawStatus is omitted", () => {
  const checkedWithLogs = {
    statusLogs: [
      { fromStatus: 3, toStatus: 4, createdAt: "2026-10-08T04:00:00Z" },
      { fromStatus: 4, toStatus: 5, createdAt: "2026-10-08T05:00:00Z" },
    ],
  };
  assert.equal(isOrderAlreadyChecked(checkedWithLogs), true);

  const pickedWithLogs = {
    statusLogs: [
      { fromStatus: 3, toStatus: 4, createdAt: "2026-10-08T04:00:00Z" },
    ],
  };
  assert.equal(isOrderAlreadyChecked(pickedWithLogs), false);
});

test("4. mapOrder preserves rawStatus: 5 for CHECKED orders and flags as already checked", () => {
  const apiOrder: ApiOrder = {
    ...baseApiOrder,
    status: ORDER_STATUS.CHECKED,
  };

  const order = mapOrder(apiOrder);

  assert.equal(order.rawStatus, 5);
  assert.equal(isOrderAlreadyChecked(order), true);
  // Status should not be packable
  assert.notEqual(order.status, "partial");
});

test("5. mapOrder preserves rawStatus: 4 for PICKED orders (ready for checking)", () => {
  const apiOrder: ApiOrder = {
    ...baseApiOrder,
    status: ORDER_STATUS.PICKED,
  };

  const order = mapOrder(apiOrder);

  assert.equal(order.rawStatus, 4);
  assert.equal(order.status, "partial");
  assert.equal(isOrderAlreadyChecked(order), false);
});

test("6. mapOrder preserves rawStatus for unpicked/new orders (not ready)", () => {
  const apiOrder: ApiOrder = {
    ...baseApiOrder,
    status: ORDER_STATUS.NEW,
  };

  const order = mapOrder(apiOrder);

  assert.equal(order.rawStatus, 1);
  assert.equal(order.status, "new");
  assert.equal(isOrderAlreadyChecked(order), false);
});

test("7. OrderSummaryLayout source contains required already-checked UI strings and navigation", () => {
  const layoutPath = join(__dirname, "../screens/OrderSummaryLayout.tsx");
  const source = readFileSync(layoutPath, "utf8");

  // Title
  assert.match(source, /Order Already Checked/);
  // Message
  assert.match(
    source,
    /This order has already been checked successfully\. Please scan another order\./,
  );
  // Button
  assert.match(source, /Scan Another Order/);
  // Navigation action
  assert.match(source, /router\.replace\(\s*["']\/scanner["']/);
  // Distinguishes already checked from not ready
  assert.match(source, /isOrderAlreadyChecked\(order\)/);
  // Retains original Order Not Ready
  assert.match(source, /Order Not Ready/);
  assert.match(
    source,
    /This order has not been checked yet and cannot be packed\./,
  );
});
