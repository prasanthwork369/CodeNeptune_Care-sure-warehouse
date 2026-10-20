import test from "node:test";
import assert from "node:assert/strict";
import { RequestQueue, QueueStorage } from "../requestQueue";

// Unsigned JWT carrying only the user id — enough for decodeJWT
const jwt = (sub: string) =>
  `h.${Buffer.from(JSON.stringify({ sub })).toString("base64url")}.s`;
const TOKEN_A = jwt("user-a");
const TOKEN_B = jwt("user-b");

// Shared by queue instances to model the persisted queue surviving a restart
const memoryStorage = () => {
  const data = new Map<string, string>();
  const storage: QueueStorage = {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
  };
  return { data, storage };
};

// Stands in for apiClient's in-memory token
const session = (token: string | null) => {
  const s = { token, get: () => s.token };
  return s;
};

// Records each replayed request; `hold` keeps the next request in flight
const fakeAxios = () => {
  const sent: string[] = [];
  let gate: Promise<void> | null = null;
  const instance = async (config: { url?: string }) => {
    sent.push(config.url!);
    if (gate) await gate;
    return { status: 200 };
  };
  const hold = () => {
    let release!: () => void;
    gate = new Promise((r) => (release = r));
    return release;
  };
  return { sent, instance, hold };
};

// As apiClient queues it: stamped with the session token that made it
const enqueue = (queue: RequestQueue, url: string, token = TOKEN_A) =>
  queue.add(
    { url, method: "post", headers: { Authorization: `Bearer ${token}` } },
    () => {},
    () => {},
  );

test("clear drops pending requests and the persisted copy", async () => {
  const { data, storage } = memoryStorage();
  const queue = new RequestQueue(() => storage, session(TOKEN_A).get);
  await enqueue(queue, "/a/release");
  assert.equal(queue.length, 1);
  assert.ok(data.size > 0);

  await queue.clear();

  assert.equal(queue.length, 0);
  assert.equal(data.size, 0);
  const { sent, instance } = fakeAxios();
  await queue.process(instance);
  assert.deepEqual(sent, []);
});

test("after logout, the next user's replay sends only their own requests", async () => {
  const { storage } = memoryStorage();
  const current = session(TOKEN_A);
  const queue = new RequestQueue(() => storage, current.get);
  await enqueue(queue, "/userA/claim");
  await enqueue(queue, "/userA/status");

  await queue.clear(); // User A logs out
  current.token = TOKEN_B;
  await enqueue(queue, "/userB/claim", TOKEN_B); // User B queues while offline

  const { sent, instance } = fakeAxios();
  await queue.process(instance);
  assert.deepEqual(sent, ["/userB/claim"]);
});

test("a queue persisted before logout is not restored on the next launch", async () => {
  const { storage } = memoryStorage();
  const before = new RequestQueue(() => storage, session(TOKEN_A).get);
  await enqueue(before, "/userA/release");
  await before.clear();

  const afterRestart = new RequestQueue(() => storage, session(null).get);
  await afterRestart.loadFromStorage();
  assert.equal(afterRestart.length, 0);
});

test("storage delete fails on logout, app restarts, User B logs in: User A's requests are never sent", async () => {
  const { data, storage } = memoryStorage();
  const before = new RequestQueue(() => storage, session(TOKEN_A).get);
  await enqueue(before, "/userA/claim");
  await enqueue(before, "/userA/release");
  const removeItem = storage.removeItem;
  storage.removeItem = async () => {
    throw new Error("disk error");
  };
  await before.clear(); // User A logs out; the persisted copy survives
  assert.ok(data.size > 0);
  storage.removeItem = removeItem; // transient: storage works after restart

  // App restart: a fresh queue restores User A's requests from disk
  const current = session(null);
  const afterRestart = new RequestQueue(() => storage, current.get);
  await afterRestart.loadFromStorage();
  assert.equal(afterRestart.length, 2);

  const { sent, instance } = fakeAxios();
  await afterRestart.process(instance); // reconnect before anyone logs in
  assert.deepEqual(sent, []);

  current.token = TOKEN_B; // User B logs in, queues offline, reconnects
  await enqueue(afterRestart, "/userB/claim", TOKEN_B);
  await afterRestart.process(instance);
  assert.deepEqual(sent, ["/userB/claim"]);
  assert.equal(afterRestart.length, 0);
});

test("storage delete keeps failing after restart: User A's requests are still never sent", async () => {
  const { storage } = memoryStorage();
  const before = new RequestQueue(() => storage, session(TOKEN_A).get);
  await enqueue(before, "/userA/claim");
  storage.removeItem = async () => {
    throw new Error("disk error");
  };
  await before.clear();

  const afterRestart = new RequestQueue(() => storage, session(TOKEN_B).get);
  await afterRestart.loadFromStorage();
  assert.equal(afterRestart.length, 1);

  const { sent, instance } = fakeAxios();
  await afterRestart.process(instance); // resolves; the storage error is handled
  assert.deepEqual(sent, []);
});

test("a restored request without a bearer token is never sent", async () => {
  const { data, storage } = memoryStorage();
  data.set(
    "offline_request_queue",
    JSON.stringify([{ url: "/anonymous", method: "post" }]),
  );
  const queue = new RequestQueue(() => storage, session(TOKEN_B).get);
  await queue.loadFromStorage();

  const { sent, instance } = fakeAxios();
  await queue.process(instance);
  assert.deepEqual(sent, []);
});

test("the same user's queue still replays after an app restart", async () => {
  const { storage } = memoryStorage();
  const before = new RequestQueue(() => storage, session(TOKEN_A).get);
  await enqueue(before, "/userA/claim");

  const afterRestart = new RequestQueue(() => storage, session(TOKEN_A).get);
  await afterRestart.loadFromStorage();
  const { sent, instance } = fakeAxios();
  await afterRestart.process(instance);
  assert.deepEqual(sent, ["/userA/claim"]);
});

test("logout during a replay stops the remaining requests", async () => {
  const { storage } = memoryStorage();
  const queue = new RequestQueue(() => storage, session(TOKEN_A).get);
  await enqueue(queue, "/userA/1");
  await enqueue(queue, "/userA/2");
  await enqueue(queue, "/userA/3");

  const { sent, instance, hold } = fakeAxios();
  const release = hold();
  const replay = queue.process(instance);
  await new Promise((r) => setImmediate(r)); // first request now in flight
  assert.deepEqual(sent, ["/userA/1"]);

  await queue.clear(); // logout while /userA/1 is in flight
  release();
  await replay;

  assert.deepEqual(sent, ["/userA/1"]);
});

test("logout while the persisted queue is loading discards it", async () => {
  const { storage } = memoryStorage();
  const seed = new RequestQueue(() => storage, session(TOKEN_A).get);
  await enqueue(seed, "/userA/release");

  const queue = new RequestQueue(() => storage, session(TOKEN_A).get);
  const loading = queue.loadFromStorage(); // getItem in flight
  await queue.clear();
  await loading;

  assert.equal(queue.length, 0);
});

test("without a logout, replay still sends every queued request in order", async () => {
  const { storage } = memoryStorage();
  const queue = new RequestQueue(() => storage, session(TOKEN_A).get);
  await enqueue(queue, "/a");
  await enqueue(queue, "/b");

  const { sent, instance } = fakeAxios();
  await queue.process(instance);
  assert.deepEqual(sent, ["/a", "/b"]);
  assert.equal(queue.length, 0);
});

test("clear still empties the queue when storage removal fails", async () => {
  const { storage } = memoryStorage();
  const queue = new RequestQueue(() => storage, session(TOKEN_A).get);
  await enqueue(queue, "/userA/claim");
  storage.removeItem = async () => {
    throw new Error("disk error");
  };

  await queue.clear();

  assert.equal(queue.length, 0);
});

// ── Storage failures during replay ──────────────────────────────────────────

const persistedUrls = (data: Map<string, string>) => {
  const raw = data.get("offline_request_queue");
  return raw ? JSON.parse(raw).map((c: { url: string }) => c.url) : [];
};

// Fails storage writes/removals while `failing` is true
const flakyStorage = () => {
  const { data, storage } = memoryStorage();
  const state = { failing: false, writes: 0, failFromWrite: Infinity };
  const guard = () => {
    state.writes++;
    if (state.failing || state.writes >= state.failFromWrite) {
      throw new Error("disk error");
    }
  };
  const flaky: QueueStorage = {
    getItem: storage.getItem,
    setItem: async (key, value) => {
      guard();
      await storage.setItem(key, value);
    },
    removeItem: async (key) => {
      guard();
      await storage.removeItem(key);
    },
  };
  return { data, storage: flaky, state };
};

test("storage write fails before replay: nothing is sent or lost, and a retry sends all", async () => {
  const { data, storage, state } = flakyStorage();
  const queue = new RequestQueue(() => storage, session(TOKEN_A).get);
  await enqueue(queue, "/1");
  await enqueue(queue, "/2");
  const settled: string[] = [];
  // a live caller waiting on its queued request (as apiClient does)
  await queue.add(
    {
      url: "/3",
      method: "post",
      headers: { Authorization: `Bearer ${TOKEN_A}` },
    },
    () => settled.push("resolved"),
    () => settled.push("rejected"),
  );

  state.failing = true;
  const { sent, instance } = fakeAxios();
  await queue.process(instance); // resolves; no unhandled rejection

  assert.deepEqual(sent, []);
  assert.equal(queue.length, 3);
  assert.deepEqual(persistedUrls(data), ["/1", "/2", "/3"]);
  assert.deepEqual(settled, []); // still pending, not dropped

  state.failing = false; // e.g. manual retry once storage recovers
  await queue.process(instance);

  assert.deepEqual(sent, ["/1", "/2", "/3"]);
  assert.deepEqual(settled, ["resolved"]);
  assert.equal(data.has("offline_request_queue"), false);
});

test("storage write fails mid-batch: sent requests aren't repeated, the rest aren't lost", async () => {
  const { data, storage, state } = flakyStorage();
  const queue = new RequestQueue(() => storage, session(TOKEN_A).get);
  await enqueue(queue, "/1");
  await enqueue(queue, "/2");
  await enqueue(queue, "/3");

  state.writes = 0;
  state.failFromWrite = 2; // the write before sending /2 fails
  const { sent, instance } = fakeAxios();
  await queue.process(instance);

  assert.deepEqual(sent, ["/1"]);
  assert.equal(queue.length, 2);
  assert.deepEqual(persistedUrls(data), ["/2", "/3"]); // /1 already off disk

  // App restart (or retry) after storage recovers: only /2 and /3 are sent
  state.failFromWrite = Infinity;
  const afterRestart = new RequestQueue(() => storage, session(TOKEN_A).get);
  await afterRestart.loadFromStorage();
  await afterRestart.process(instance);

  assert.deepEqual(sent, ["/1", "/2", "/3"]);
});

test("app killed mid-replay: the in-flight request is not resent, unsent ones survive", async () => {
  const { data, storage } = memoryStorage();
  const queue = new RequestQueue(() => storage, session(TOKEN_A).get);
  await enqueue(queue, "/1");
  await enqueue(queue, "/2");
  await enqueue(queue, "/3");

  const { sent, instance, hold } = fakeAxios();
  const release = hold();
  void queue.process(instance);
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(sent, ["/1"]); // /1 in flight when the app dies
  assert.deepEqual(persistedUrls(data), ["/2", "/3"]);
  release();

  const afterRestart = new RequestQueue(() => storage, session(TOKEN_A).get);
  await afterRestart.loadFromStorage();
  const replayed = fakeAxios();
  await afterRestart.process(replayed.instance);

  assert.deepEqual(replayed.sent, ["/2", "/3"]); // /1 not sent a second time
});

test("process never rejects, even when storage keeps failing", async () => {
  const { storage, state } = flakyStorage();
  const queue = new RequestQueue(() => storage, session(TOKEN_A).get);
  await enqueue(queue, "/1");
  state.failing = true;
  const { instance } = fakeAxios();

  await queue.process(instance);
  await queue.process(instance);

  assert.equal(queue.length, 1);
});

test("calls during a replay join it: each request is sent once, in order", async () => {
  const { storage } = memoryStorage();
  const queue = new RequestQueue(() => storage, session(TOKEN_A).get);
  await enqueue(queue, "/1");
  await enqueue(queue, "/2");

  const { sent, instance, hold } = fakeAxios();
  const release = hold();
  const first = queue.process(instance); // e.g. the startup replay
  await new Promise((r) => setImmediate(r));
  const second = queue.process(instance); // reconnect event
  const third = queue.process(instance); // manual retry
  await enqueue(queue, "/3"); // another request queued meanwhile
  release();
  await Promise.all([first, second, third]);

  assert.deepEqual(sent, ["/1", "/2", "/3"]);
  assert.equal(queue.length, 0);
});

test("logout mid-replay: User A's rest is never sent; User B's queue replays after", async () => {
  const { storage } = memoryStorage();
  const current = session(TOKEN_A);
  const queue = new RequestQueue(() => storage, current.get);
  await enqueue(queue, "/userA/1");
  await enqueue(queue, "/userA/2");

  const { sent, instance, hold } = fakeAxios();
  const release = hold();
  const replayA = queue.process(instance);
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(sent, ["/userA/1"]); // in flight

  await queue.clear(); // User A logs out
  current.token = TOKEN_B; // User B logs in and queues offline
  await enqueue(queue, "/userB/1", TOKEN_B);
  const replayB = queue.process(instance); // joins A's replay, runs after it
  release();
  await Promise.all([replayA, replayB]);

  assert.deepEqual(sent, ["/userA/1", "/userB/1"]);
});
