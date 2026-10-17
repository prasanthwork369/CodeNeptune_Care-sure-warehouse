import test from "node:test";
import assert from "node:assert/strict";
import Module from "node:module";

// Startup as app/_layout.tsx runs it: real useAuthStore.initialize(),
// initNetworkListener and requestQueue. Only native modules are replaced.
type NetState = { isConnected: boolean | null; isInternetReachable: boolean | null };
const ONLINE: NetState = { isConnected: true, isInternetReachable: true };
const OFFLINE: NetState = { isConnected: false, isInternetReachable: false };

const asyncStorageData = new Map<string, string>();
const secureStoreData = new Map<string, string>();
// When set, SecureStore reads wait for it (slow token restore)
let secureStoreReadGate: Promise<void> | null = null;
let netInfoFetchState: NetState = ONLINE;
let netInfoListeners: ((state: NetState) => void)[] = [];

const nativeStubs: Record<string, unknown> = {
  "react-native": {
    Platform: { OS: "android" },
    AppState: { currentState: "background" },
  },
  "expo-secure-store": {
    setItemAsync: async (key: string, value: string) => {
      secureStoreData.set(key, value);
    },
    getItemAsync: async (key: string) => {
      if (secureStoreReadGate) await secureStoreReadGate;
      return secureStoreData.get(key) ?? null;
    },
    deleteItemAsync: async (key: string) => {
      secureStoreData.delete(key);
    },
  },
  "@react-native-async-storage/async-storage": {
    __esModule: true,
    default: {
      getItem: async (key: string) => asyncStorageData.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        asyncStorageData.set(key, value);
      },
      removeItem: async (key: string) => {
        asyncStorageData.delete(key);
      },
    },
  },
  "@react-native-community/netinfo": {
    __esModule: true,
    default: {
      fetch: async () => netInfoFetchState,
      addEventListener: (listener: (state: NetState) => void) => {
        netInfoListeners.push(listener);
        return () => {};
      },
    },
  },
};
const loader = Module as unknown as {
  _load: (request: string, ...rest: unknown[]) => unknown;
};
const originalLoad = loader._load;
loader._load = function (request: string, ...rest: unknown[]) {
  return request in nativeStubs
    ? nativeStubs[request]
    : originalLoad.call(this, request, ...rest);
};
process.env.EXPO_PUBLIC_API_BASE_URL = "http://localhost.invalid";
(globalThis as { __DEV__?: boolean }).__DEV__ = false;

const jwt = (sub: string) =>
  `h.${Buffer.from(JSON.stringify({ sub })).toString("base64url")}.s`;
const TOKEN_A = jwt("user-a");
const TOKEN_B = jwt("user-b");

const settle = async () => {
  for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r));
};

// A device NetInfo event (the first one fires soon after subscribing)
const emitNetInfo = (state: NetState) =>
  netInfoListeners.forEach((listener) => listener(state));

// Offline queue saved by a previous launch, as apiClient queues requests
const saveQueue = (requests: { url: string; token: string }[]) =>
  asyncStorageData.set(
    "offline_request_queue",
    JSON.stringify(
      requests.map(({ url, token }) => ({
        url,
        method: "post",
        headers: { Authorization: `Bearer ${token}` },
      })),
    ),
  );

// Fresh launch: new module instances, persisted storage kept
const startApp = (loggedInAs: string | null) => {
  for (const key of Object.keys(require.cache)) {
    if (/[\\/]src[\\/]/.test(key) && !key.includes("node_modules")) {
      delete require.cache[key];
    }
  }
  secureStoreData.clear();
  if (loggedInAs) {
    secureStoreData.set("access_token", loggedInAs);
    secureStoreData.set("session_id", "session-1");
  }
  netInfoListeners = [];

  /* eslint-disable @typescript-eslint/no-require-imports */
  const { useAuthStore } = require("../../store/useAuthStore");
  const { initNetworkListener } = require("../network");
  const { apiClient } = require("../../api/client");
  const { requestQueue } = require("../requestQueue");
  /* eslint-enable @typescript-eslint/no-require-imports */

  // GET /users/me during initialize()
  apiClient.defaults.adapter = async (config: unknown) => ({
    data: { success: true, data: { id: "me" } },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });

  // Replayed requests (apiClient in the app); `hold` keeps one in flight
  const sent: string[] = [];
  let gate: Promise<void> | null = null;
  const replayAxios = async (config: { url: string }) => {
    sent.push(config.url);
    if (gate) await gate;
    return { status: 200 };
  };
  const hold = () => {
    let release!: () => void;
    gate = new Promise((r) => (release = r));
    return () => {
      gate = null;
      release();
    };
  };

  // As app/_layout.tsx does
  const sessionRestored = useAuthStore.getState().initialize();
  initNetworkListener(replayAxios, sessionRestored);
  return { sent, sessionRestored, requestQueue, hold };
};

const reset = () => {
  asyncStorageData.clear();
  secureStoreReadGate = null;
  netInfoFetchState = ONLINE;
};

test("starting online with a saved queue replays it without another network event", async () => {
  reset();
  saveQueue([
    { url: "/a/claim", token: TOKEN_A },
    { url: "/a/pick", token: TOKEN_A },
  ]);

  const app = startApp(TOKEN_A); // no NetInfo event is emitted at all
  await app.sessionRestored;
  await settle();

  assert.deepEqual(app.sent, ["/a/claim", "/a/pick"]);
  assert.equal(asyncStorageData.has("offline_request_queue"), false);
});

test("network event before the token is restored: replay runs once it is", async () => {
  reset();
  saveQueue([{ url: "/a/claim", token: TOKEN_A }]);
  let finishTokenRead!: () => void;
  secureStoreReadGate = new Promise((r) => (finishTokenRead = r));

  const app = startApp(TOKEN_A);
  emitNetInfo(ONLINE); // first NetInfo event, token still being read
  await settle();
  assert.deepEqual(app.sent, []);

  finishTokenRead();
  secureStoreReadGate = null;
  await app.sessionRestored;
  await settle();

  assert.deepEqual(app.sent, ["/a/claim"]);
});

test("starting offline keeps the queue until connectivity returns", async () => {
  reset();
  saveQueue([{ url: "/a/claim", token: TOKEN_A }]);
  netInfoFetchState = OFFLINE;

  const app = startApp(TOKEN_A);
  emitNetInfo(OFFLINE);
  await app.sessionRestored;
  await settle();
  assert.deepEqual(app.sent, []);
  assert.equal(app.requestQueue.length, 1);

  emitNetInfo(ONLINE);
  await settle();

  assert.deepEqual(app.sent, ["/a/claim"]);
});

test("startup replay still never sends another user's saved requests", async () => {
  reset();
  saveQueue([
    { url: "/a/claim", token: TOKEN_A },
    { url: "/b/claim", token: TOKEN_B },
  ]);

  const app = startApp(TOKEN_B); // User B is the restored session
  emitNetInfo(ONLINE);
  await app.sessionRestored;
  await settle();

  assert.deepEqual(app.sent, ["/b/claim"]);
});

test("starting logged out replays nothing", async () => {
  reset();
  saveQueue([{ url: "/a/claim", token: TOKEN_A }]);

  const app = startApp(null);
  emitNetInfo(ONLINE);
  await app.sessionRestored;
  await settle();

  assert.deepEqual(app.sent, []);
});

test("concurrent startup and network events send each saved request once", async () => {
  reset();
  saveQueue([
    { url: "/a/claim", token: TOKEN_A },
    { url: "/a/pick", token: TOKEN_A },
  ]);
  let finishTokenRead!: () => void;
  secureStoreReadGate = new Promise((r) => (finishTokenRead = r));

  const app = startApp(TOKEN_A);
  const releaseFirst = app.hold();
  // Before the session is restored: NetInfo event, flapping, a manual retry
  emitNetInfo(ONLINE);
  emitNetInfo(OFFLINE);
  emitNetInfo(ONLINE);
  void app.requestQueue.process(async () => assert.fail("replayed early"));
  finishTokenRead();
  secureStoreReadGate = null;
  await app.sessionRestored;
  await settle();
  assert.deepEqual(app.sent, ["/a/claim"]); // in flight

  // More events while the replay is in flight
  emitNetInfo(OFFLINE);
  emitNetInfo(ONLINE);
  await settle();
  releaseFirst();
  await settle();

  assert.deepEqual(app.sent, ["/a/claim", "/a/pick"]);
});
