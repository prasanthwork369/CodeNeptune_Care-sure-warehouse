import test from "node:test";
import assert from "node:assert/strict";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import {
  FULFILLMENT_EVENTS,
  refreshSyncedQueries,
  subscribeFulfillmentEvents,
} from "../fulfillmentSync";

// Minimal stand-in for useSocket's `on`: registers a wrapper per call and
// returns a cleanup that removes exactly that wrapper
const fakeSocket = () => {
  const listeners = new Map<string, Set<(data?: any) => void>>();
  const on = (event: string, cb: (data?: any) => void) => {
    const wrapper = (data?: any) => cb(data);
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(wrapper);
    return () => {
      listeners.get(event)!.delete(wrapper);
    };
  };
  const emit = (event: string, data?: any) =>
    listeners.get(event)?.forEach((l) => l(data));
  const count = (event: string) => listeners.get(event)?.size ?? 0;
  return { on, emit, count };
};

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

// Mounts the Checker Today query (PackerLayout's key) with an active observer,
// as when the screen is on display, and counts fetches after mount
const mountCheckerToday = async (client: QueryClient) => {
  let fetches = 0;
  const queryKey = ["checker-packed-today"];
  const queryFn = async () => {
    fetches++;
    return [];
  };
  await client.fetchQuery({ queryKey, queryFn });
  // staleTime Infinity: subscribing must not refetch, only invalidation may
  const observer = new QueryObserver(client, {
    queryKey,
    queryFn,
    staleTime: Infinity,
  });
  const unsubscribe = observer.subscribe(() => {});
  const base = fetches;
  return { fetchesSinceMount: () => fetches - base, unsubscribe };
};

test("a packed/order socket event refreshes the Checker Today query", async () => {
  const client = makeClient();
  const socket = fakeSocket();
  const today = await mountCheckerToday(client);
  let pending: Promise<unknown> = Promise.resolve();
  subscribeFulfillmentEvents(socket.on, () => {
    pending = refreshSyncedQueries(client);
  });

  socket.emit("order_updated", { status: "packed" });
  await pending;

  assert.equal(today.fetchesSinceMount(), 1);
  today.unsubscribe();
});

test("an order-type notification refreshes Checker Today", async () => {
  const client = makeClient();
  const socket = fakeSocket();
  const today = await mountCheckerToday(client);
  let pending: Promise<unknown> = Promise.resolve();
  subscribeFulfillmentEvents(socket.on, () => {
    pending = refreshSyncedQueries(client);
  });

  socket.emit("notification", { type: "orders.packed" });
  await pending;

  assert.equal(today.fetchesSinceMount(), 1);
  today.unsubscribe();
});

test("unrelated events and notifications do not trigger a refresh", () => {
  const socket = fakeSocket();
  let syncs = 0;
  subscribeFulfillmentEvents(socket.on, () => syncs++);

  socket.emit("checker-packed-today"); // query key, not a server event
  socket.emit("user_updated");
  socket.emit("notification", { type: "system.maintenance" });
  socket.emit("notification", undefined);

  assert.equal(syncs, 0);
});

test("resubscribing after a reconnect leaves exactly one listener per event", () => {
  const socket = fakeSocket();
  let syncs = 0;

  // isConnected: true → false → true re-runs the effect: cleanup, then subscribe
  const first = subscribeFulfillmentEvents(socket.on, () => syncs++);
  first();
  subscribeFulfillmentEvents(socket.on, () => syncs++);

  for (const e of [...FULFILLMENT_EVENTS, "notification"])
    assert.equal(socket.count(e), 1, `duplicate listeners for "${e}"`);

  socket.emit("lock_update");
  assert.equal(syncs, 1);
});

test("cleanup removes every listener it registered", () => {
  const socket = fakeSocket();
  const cleanup = subscribeFulfillmentEvents(socket.on, () => {});
  cleanup();
  for (const e of [...FULFILLMENT_EVENTS, "notification"])
    assert.equal(socket.count(e), 0);
});

test("reconnect resync refreshes Checker Today", async () => {
  const client = makeClient();
  const today = await mountCheckerToday(client);

  await refreshSyncedQueries(client);

  assert.equal(today.fetchesSinceMount(), 1);
  today.unsubscribe();
});
