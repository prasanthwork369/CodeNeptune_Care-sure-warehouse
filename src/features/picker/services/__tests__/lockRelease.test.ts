import test from "node:test";
import assert from "node:assert/strict";
import { createReleaseTracker } from "../lockRelease";

const clock = (start = 1_000) => {
  let t = start;
  return { now: () => t, tick: (ms: number) => (t += ms) };
};

// Mirrors PickerLayout: New Orders = "new" orders that are not locked
const visibleNewOrders = (orderIds: string[], locks: { orderId: string }[]) => {
  const locked = new Set(locks.map((l) => l.orderId));
  return orderIds.filter((id) => !locked.has(id));
};

test("D_ID_10: locks refetched while the release is in flight keep New Orders order stable", () => {
  const c = clock();
  const tracker = createReleaseTracker(c.now);
  const queue = ["order-1", "order-2"];

  // Back pressed: release starts, Picker regains focus and refetches locks
  tracker.start("order-1");
  const requestedAt = c.now();
  c.tick(50);
  // Server has not processed the release yet, so it still reports the lock
  const staleResponse = [{ orderId: "order-1", pickerId: "me", ttl: 500 }];

  const locks = tracker.filter(staleResponse, requestedAt);
  assert.deepEqual(locks, []);
  assert.deepEqual(visibleNewOrders(queue, locks), ["order-1", "order-2"]);
});

test("D_ID_10: a stale response for a request started before the release succeeded is dropped", () => {
  const c = clock();
  const tracker = createReleaseTracker(c.now);
  tracker.start("order-1");
  const requestedAt = c.now();
  c.tick(20);
  tracker.succeed("order-1"); // release lands while the GET is still in flight
  c.tick(20);

  assert.deepEqual(tracker.filter([{ orderId: "order-1" }], requestedAt), []);
});

test("a lock reported by a request started after the release succeeded is kept", () => {
  const c = clock();
  const tracker = createReleaseTracker(c.now);
  tracker.start("order-1");
  c.tick(20);
  tracker.succeed("order-1");
  c.tick(10);
  // e.g. another picker claimed the order after our release
  const requestedAt = c.now();
  assert.deepEqual(tracker.filter([{ orderId: "order-1" }], requestedAt), [
    { orderId: "order-1" },
  ]);
});

test("a failed release stops filtering, so the still-held lock hides the order", () => {
  const c = clock();
  const tracker = createReleaseTracker(c.now);
  tracker.start("order-1");
  tracker.clear("order-1"); // onError
  assert.deepEqual(tracker.filter([{ orderId: "order-1" }], c.now()), [
    { orderId: "order-1" },
  ]);
});

test("re-claiming the same order clears the pending release so its new lock counts", () => {
  const c = clock();
  const tracker = createReleaseTracker(c.now);
  tracker.start("order-1");
  tracker.clear("order-1"); // claim mutation
  assert.equal(tracker.filter([{ orderId: "order-1" }], c.now()).length, 1);
});

test("locks for other orders are never filtered", () => {
  const c = clock();
  const tracker = createReleaseTracker(c.now);
  tracker.start("order-1");
  const locks = [{ orderId: "order-1" }, { orderId: "order-3" }];
  assert.deepEqual(tracker.filter(locks, c.now()), [{ orderId: "order-3" }]);
  assert.deepEqual(
    visibleNewOrders(
      ["order-1", "order-2", "order-3"],
      tracker.filter(locks, c.now()),
    ),
    ["order-1", "order-2"],
  );
});

test("settled releases are pruned after the TTL", () => {
  const c = clock();
  const tracker = createReleaseTracker(c.now);
  tracker.start("order-1");
  const oldRequest = c.now();
  tracker.succeed("order-1");
  c.tick(61_000);
  tracker.filter([], c.now()); // prunes
  // Entry gone: even an old request's lock is now passed through as-is
  assert.equal(tracker.filter([{ orderId: "order-1" }], oldRequest).length, 1);
});
