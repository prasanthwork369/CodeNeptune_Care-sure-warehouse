import test from "node:test";
import assert from "node:assert/strict";
import Module from "node:module";

// Runs the real useAuthStore, apiClient, authService and requestQueue. Only
// native modules are replaced, at the Node module loader, before those load.
const events: string[] = [];
const asyncStorageData = new Map<string, string>();
const secureStoreData = new Map<string, string>();
// When set, AsyncStorage reads wait for it (models a slow rehydration)
let asyncStorageReadGate: Promise<void> | null = null;
// When true, writing notification history to AsyncStorage fails
let notificationWritesFail = false;
const nativeStubs: Record<string, unknown> = {
  "react-native": {
    Platform: { OS: "android" },
    AppState: { currentState: "background" },
  },
  "expo-secure-store": {
    setItemAsync: async (key: string, value: string) => {
      secureStoreData.set(key, value);
    },
    getItemAsync: async (key: string) => secureStoreData.get(key) ?? null,
    deleteItemAsync: async (key: string) => {
      events.push(`secure-store delete ${key}`);
      secureStoreData.delete(key);
    },
  },
  "@react-native-async-storage/async-storage": {
    __esModule: true, // `import AsyncStorage from` resolves to `default`
    default: {
      // Reads the value when called; the gate only delays delivering it
      getItem: async (key: string) => {
        const value = asyncStorageData.get(key) ?? null;
        if (asyncStorageReadGate) await asyncStorageReadGate;
        return value;
      },
      setItem: async (key: string, value: string) => {
        if (notificationWritesFail && key === "notification-storage") {
          throw new Error("disk error");
        }
        asyncStorageData.set(key, value);
      },
      removeItem: async (key: string) => {
        asyncStorageData.delete(key);
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

/* eslint-disable @typescript-eslint/no-require-imports */
const { useAuthStore } = require("../useAuthStore");
const { requestQueue } = require("../../utils/requestQueue");
const { getAccessToken } = require("../../api/client");
const { useNetworkStore } = require("../useNetworkStore");
const { authService } = require("../../features/auth/services/auth.service");
const { apiClient } = require("../../api/client");
const { orderService } = require("../../features/picker/services/order.service");
const { useOrderStore } = require("../../features/picker/store/useOrderStore");
const { useNotificationStore } = require("../useNotificationStore");
const { setUnauthorizedHandler } = require("../../api/client");
const axios = require("axios");
const { QueryClient, MutationObserver } = require("@tanstack/react-query");
const { runLogout } = require("../../features/auth/services/logoutFlow");
/* eslint-enable @typescript-eslint/no-require-imports */

const jwt = (sub: string) =>
  `h.${Buffer.from(JSON.stringify({ sub })).toString("base64url")}.s`;
const TOKEN_A = jwt("user-a");
const TOKEN_B = jwt("user-b");

// Log when the real queue is cleared and which token was still live then
const originalClear = requestQueue.clear.bind(requestQueue);
requestQueue.clear = () => {
  const token = getAccessToken();
  events.push(
    `queue clear (token: ${token === TOKEN_A ? "A" : token === null ? "none" : "other"})`,
  );
  return originalClear();
};

// User A logs in and queues a request while offline, as apiClient does
const loginAndQueueAsA = async () => {
  events.length = 0;
  await useAuthStore.getState().login(TOKEN_A);
  await requestQueue.add(
    {
      url: "/api/v1/fulfillment/orders/1/release",
      method: "delete",
      headers: { Authorization: `Bearer ${TOKEN_A}` },
    },
    () => {},
    () => {},
  );
  assert.equal(requestQueue.length, 1);
};

const recordReplay = async () => {
  const sent: string[] = [];
  await requestQueue.process(async (config: { url: string }) => {
    sent.push(config.url);
    return { status: 200 };
  });
  return sent;
};

test("useAuthStore.logout clears the queue before removing User A's token", async () => {
  await loginAndQueueAsA();

  await useAuthStore.getState().logout();

  // Cleared while A's in-memory token was still set, and before the stored
  // token was deleted
  assert.equal(events[0], "queue clear (token: A)");
  assert.ok(events.indexOf("secure-store delete access_token") > 0);
  assert.equal(requestQueue.length, 0);
  assert.equal(asyncStorageData.has("offline_request_queue"), false);
  assert.equal(getAccessToken(), null);
  assert.equal(useAuthStore.getState().isAuthenticated, false);

  await useAuthStore.getState().login(TOKEN_B); // User B logs in
  assert.deepEqual(await recordReplay(), []);
  await useAuthStore.getState().logout();
});

test("authService.logout with the logout API offline still clears the queue", async () => {
  await loginAndQueueAsA();
  // apiClient rejects requests while offline, so POST /auth/logout fails
  useNetworkStore.getState().setIsConnected(false, false);

  await assert.rejects(authService.logout());

  assert.equal(events[0], "queue clear (token: A)");
  assert.equal(requestQueue.length, 0);
  assert.equal(getAccessToken(), null);

  useNetworkStore.getState().setIsConnected(true, true);
  await useAuthStore.getState().login(TOKEN_B);
  assert.deepEqual(await recordReplay(), []);
  await useAuthStore.getState().logout();
});

// ── Picker order store ──────────────────────────────────────────────────────

// Picker queue as the API returns it; status 3 maps to "new", 9 to "partial"
const apiOrder = (id: string, status: number) => ({
  id,
  orderId: `CS_ORD_${id}`,
  customerId: "c1",
  status,
  paymentStatus: "PAID",
  deliveryType: "STANDARD",
  deliveryAddress: { city: "", line1: "", state: "", country: "", pincode: "" },
  total: "0",
  createdAt: new Date().toISOString(),
  customer: { firstName: "", lastName: "", email: "", phone: "" },
  items: [],
});

// Serves the picker queue to whichever user's token the request carries
const pickerQueueBy: Record<string, ReturnType<typeof apiOrder>[]> = {
  [`Bearer ${TOKEN_A}`]: [apiOrder("a-new", 3), apiOrder("a-partial", 9)],
  [`Bearer ${TOKEN_B}`]: [apiOrder("b-new", 3)],
};
apiClient.defaults.adapter = async (config: {
  headers: Record<string, string>;
}) => ({
  data: { success: true, data: pickerQueueBy[config.headers.Authorization] ?? [] },
  status: 200,
  statusText: "OK",
  headers: {},
  config,
});

const orderIds = () =>
  useOrderStore.getState().orders.map((o: { id: string }) => o.id);

// User A opens Picker (loads the queue) and is on the Completed tab
const loadPickerAsA = async () => {
  await useAuthStore.getState().login(TOKEN_A);
  await orderService.list();
  useOrderStore.getState().setActiveTab("completed");
  assert.deepEqual(orderIds(), ["a-new", "a-partial"]);
};

test("logout clears the picker orders and keeps the selected tab", async () => {
  await loadPickerAsA();

  await useAuthStore.getState().logout();

  assert.deepEqual(orderIds(), []);
  assert.equal(useOrderStore.getState().ordersError, null);
  assert.equal(useOrderStore.getState().activeTab, "completed");
});

test("authService.logout with the logout API offline still clears picker orders", async () => {
  await loadPickerAsA();
  useNetworkStore.getState().setIsConnected(false, false);
  try {
    await assert.rejects(authService.logout());

    assert.deepEqual(orderIds(), []);
  } finally {
    useNetworkStore.getState().setIsConnected(true, true);
  }
});

test("after User B logs in, only User B's orders are in the picker store", async () => {
  await loadPickerAsA();
  await useAuthStore.getState().logout();

  await useAuthStore.getState().login(TOKEN_B);
  try {
    assert.deepEqual(orderIds(), []); // nothing of A's before B's queue loads
    await orderService.list();

    assert.deepEqual(orderIds(), ["b-new"]);
  } finally {
    await useAuthStore.getState().logout();
  }
});

test("picker store behaves as before while logged in", async () => {
  await useAuthStore.getState().login(TOKEN_A);
  const orders = await orderService.list();

  assert.deepEqual(
    orders.map((o: { status: string }) => o.status),
    ["new", "partial"],
  );
  assert.deepEqual(orderIds(), ["a-new", "a-partial"]);
  useOrderStore.getState().setActiveTab("partial");
  assert.equal(useOrderStore.getState().activeTab, "partial");
  await useAuthStore.getState().logout();
});

// ── Notification history ────────────────────────────────────────────────────

const NOTIFICATION_KEY = "notification-storage";
type NotificationStore = typeof useNotificationStore;

const historyTitles = (store: NotificationStore = useNotificationStore) =>
  store.getState().history.map((n: { title: string }) => n.title);
const persistedHistoryTitles = () => {
  const raw = asyncStorageData.get(NOTIFICATION_KEY);
  return raw
    ? JSON.parse(raw).state.history.map((n: { title: string }) => n.title)
    : [];
};


// Lets pending storage reads/writes and the session check finish
const settle = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
};

// App restart: fresh auth and notification stores (in-memory state gone,
// SecureStore and AsyncStorage kept), started the way app/_layout.tsx does
const authStorePath = require.resolve("../useAuthStore");
const notificationStorePath = require.resolve("../useNotificationStore");
const restartApp = (): {
  auth: typeof useAuthStore;
  notifications: NotificationStore;
  starting: Promise<void>;
} => {
  delete require.cache[authStorePath];
  delete require.cache[notificationStorePath];
  /* eslint-disable @typescript-eslint/no-require-imports */
  const auth = require("../useAuthStore").useAuthStore;
  const notifications = require("../useNotificationStore").useNotificationStore;
  /* eslint-enable @typescript-eslint/no-require-imports */
  return { auth, notifications, starting: auth.getState().initialize() };
};

const notify = (store: NotificationStore, title: string, silent = false) =>
  store.getState().addNotification({ title, message: "", type: "info", silent });

// User A logs in and receives two notifications (one only in history)
const notifyAsA = async () => {
  await useAuthStore.getState().login(TOKEN_A);
  await settle();
  notify(useNotificationStore, "A: order ready");
  notify(useNotificationStore, "A: order opened", true);
  await settle();
  assert.deepEqual(historyTitles(), ["A: order opened", "A: order ready"]);
  assert.deepEqual(persistedHistoryTitles(), ["A: order opened", "A: order ready"]);
};

test("logout clears notification history in memory and in storage", async () => {
  await notifyAsA();

  await useAuthStore.getState().logout();
  await settle();

  assert.deepEqual(historyTitles(), []);
  assert.deepEqual(persistedHistoryTitles(), []);
});

test("authService.logout with the logout API offline still clears history", async () => {
  await notifyAsA();
  useNetworkStore.getState().setIsConnected(false, false);
  try {
    await assert.rejects(authService.logout());
    await settle();

    assert.deepEqual(historyTitles(), []);
    assert.deepEqual(persistedHistoryTitles(), []);
  } finally {
    useNetworkStore.getState().setIsConnected(true, true);
  }
});

test("expired session (401, refresh rejected) clears history", async () => {
  await notifyAsA();
  // app/_layout.tsx registers this handler; it ends with useAuthStore.logout()
  let handlerLogout: Promise<void> | undefined;
  setUnauthorizedHandler(() => {
    handlerLogout = useAuthStore.getState().logout();
  });
  const unauthorized = (config: unknown) =>
    Promise.reject(
      new axios.AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, null, {
        status: 401, statusText: "Unauthorized", headers: {}, config, data: {},
      }),
    );
  const apiAdapter = apiClient.defaults.adapter;
  const refreshAdapter = axios.defaults.adapter;
  apiClient.defaults.adapter = unauthorized; // access token expired
  axios.defaults.adapter = unauthorized; // POST /auth/refresh rejected too
  try {
    await assert.rejects(apiClient.get("/api/v1/users/me"));
    assert.ok(handlerLogout, "unauthorized handler was not called");
    await handlerLogout;
    await settle();

    assert.equal(useAuthStore.getState().isAuthenticated, false);
    assert.deepEqual(historyTitles(), []);
    assert.deepEqual(useNotificationStore.getState().visible, []); // toast gone
    assert.deepEqual(persistedHistoryTitles(), []);
  } finally {
    apiClient.defaults.adapter = apiAdapter;
    axios.defaults.adapter = refreshAdapter;
    setUnauthorizedHandler(() => {});
  }
});

test("User B logging in after User A logs out sees only their own history", async () => {
  await notifyAsA();
  await useAuthStore.getState().logout();

  await useAuthStore.getState().login(TOKEN_B);
  await settle();
  assert.deepEqual(historyTitles(), []);
  notify(useNotificationStore, "B: order ready");
  await settle();

  assert.deepEqual(historyTitles(), ["B: order ready"]);
  assert.deepEqual(persistedHistoryTitles(), ["B: order ready"]);
  await useAuthStore.getState().logout();
});

test("history cleanup fails on logout, app restarts: neither User B nor User A sees it again", async () => {
  await notifyAsA();
  notificationWritesFail = true;
  try {
    await useAuthStore.getState().logout();
    await settle();
    assert.deepEqual(historyTitles(), []);
    // The cleared history could not be written: User A's copy is still on disk
    assert.deepEqual(persistedHistoryTitles(), ["A: order opened", "A: order ready"]);

    // Same launch: User A logs straight back in (new session, same user id)
    await useAuthStore.getState().login(TOKEN_A);
    await settle();
    assert.deepEqual(historyTitles(), []);

    // Restart while that new session is active; the old session's copy is
    // still on disk and must not be loaded into it
    const relaunched = restartApp();
    await relaunched.starting;
    await settle();
    assert.equal(relaunched.auth.getState().isAuthenticated, true);
    assert.deepEqual(historyTitles(relaunched.notifications), []);
    await relaunched.auth.getState().logout();

    // Restart logged out; the stale copy is still on disk
    const app = restartApp();
    await app.starting;
    await settle();
    assert.deepEqual(historyTitles(app.notifications), []);

    await app.auth.getState().login(TOKEN_B); // User B
    await settle();
    assert.deepEqual(historyTitles(app.notifications), []);
    await app.auth.getState().logout();

    await app.auth.getState().login(TOKEN_A); // User A again
    await settle();
    assert.deepEqual(historyTitles(app.notifications), []);
    await app.auth.getState().logout();
  } finally {
    notificationWritesFail = false;
  }
});

test("history survives app restarts while the same session stays logged in", async () => {
  await notifyAsA();

  const app = restartApp();
  await app.starting;
  await settle();
  assert.deepEqual(historyTitles(app.notifications), ["A: order opened", "A: order ready"]);

  // Home's pull-to-refresh runs initialize() again: same session, same history
  await app.auth.getState().initialize();
  await settle();
  assert.deepEqual(historyTitles(app.notifications), ["A: order opened", "A: order ready"]);

  notify(app.notifications, "A: after restart");
  await settle();
  assert.deepEqual(persistedHistoryTitles(), [
    "A: after restart",
    "A: order opened",
    "A: order ready",
  ]);
  await app.auth.getState().logout();
});

test("legacy history without a session tag is never shown", async () => {
  // Saved by the previous app version, by whoever was logged in then
  asyncStorageData.set(
    NOTIFICATION_KEY,
    JSON.stringify({
      state: {
        history: [{ id: "x", title: "legacy", message: "", type: "info", timestamp: 1 }],
      },
      version: 0,
    }),
  );
  // Still logged in from before session ids existed
  secureStoreData.set("access_token", TOKEN_A);
  secureStoreData.delete("session_id");

  const app = restartApp();
  await app.starting;
  await settle();

  assert.deepEqual(historyTitles(app.notifications), []);
  assert.deepEqual(persistedHistoryTitles(), []);
  assert.ok(secureStoreData.get("session_id"), "a session id was started");
  await app.auth.getState().logout();
});

test("stored history is not shown before the session check finishes", async () => {
  await notifyAsA();
  let finishRead!: () => void;
  asyncStorageReadGate = new Promise((r) => (finishRead = r));
  try {
    const app = restartApp();
    // e.g. the notification tap that opened the app, before auth is restored
    notify(app.notifications, "A: arrived during startup", true);
    await app.starting; // session restored; history read still pending
    await settle();
    assert.deepEqual(historyTitles(app.notifications), ["A: arrived during startup"]);

    finishRead();
    await settle();
    assert.deepEqual(historyTitles(app.notifications), [
      "A: arrived during startup",
      "A: order opened",
      "A: order ready",
    ]);
    await app.auth.getState().logout();
  } finally {
    asyncStorageReadGate = null;
  }
});

test("session expiring while stored history is still loading keeps it hidden", async () => {
  await notifyAsA();
  let finishRead!: () => void;
  asyncStorageReadGate = new Promise((r) => (finishRead = r));
  try {
    const app = restartApp();
    await app.starting;
    await app.auth.getState().logout(); // expired-session logout at cold start

    finishRead();
    await settle();
    assert.deepEqual(historyTitles(app.notifications), []);
    assert.deepEqual(persistedHistoryTitles(), []);
  } finally {
    asyncStorageReadGate = null;
  }
});

test("notification behaviour is unchanged while logged in", async () => {
  // Fresh app, so earlier tests' toasts don't fill the 3 visible slots
  const app = restartApp();
  await app.starting;
  await app.auth.getState().login(TOKEN_A);
  await settle();
  const store = app.notifications;
  const historyTitles = () =>
    store.getState().history.map((n: { title: string }) => n.title);
  const { addNotification } = store.getState();
  const before = store.getState().visible.length;
  assert.equal(before, 0);

  addNotification({ title: "toast", message: "", type: "info", orderId: "x1" });
  addNotification({ title: "toast again", message: "", type: "info", orderId: "x1" });
  addNotification({ title: "history only", message: "", type: "info", silent: true });
  await settle();

  // Duplicate orderId is not shown twice; silent goes to history only
  const visibleTitles = store.getState().visible.map((n: { title: string }) => n.title);
  assert.equal(store.getState().visible.length, before + 1);
  assert.ok(visibleTitles.includes("toast"));
  assert.deepEqual(historyTitles().slice(0, 3), ["history only", "toast again", "toast"]);
  // Only history (and its session tag) is persisted, not on-screen toasts
  assert.deepEqual(
    Object.keys(JSON.parse(asyncStorageData.get(NOTIFICATION_KEY)!).state).sort(),
    ["history", "historySession"],
  );

  const toast = store.getState().visible.find((n: { title: string }) => n.title === "toast");
  store.getState().removeNotification(toast.id);
  assert.equal(store.getState().visible.length, before);

  store.getState().clearHistory(); // the Notifications screen's clear button
  assert.deepEqual(historyTitles(), []);
  await app.auth.getState().logout();
});

// ── Notification toasts ─────────────────────────────────────────────────────

const toastTitles = (store: NotificationStore) => ({
  visible: store.getState().visible.map((n: { title: string }) => n.title),
  queue: store.getState().queue.map((n: { title: string }) => n.title),
});

// Fresh app with User A logged in and 4 toasts: 3 on screen, 1 waiting
const appWithToastsForA = async () => {
  const app = restartApp();
  await app.starting;
  await app.auth.getState().login(TOKEN_A);
  await settle();
  for (const n of [1, 2, 3, 4]) {
    app.notifications.getState().addNotification({
      title: `A${n}`, message: "", type: "info", orderId: `a${n}`,
    });
  }
  assert.deepEqual(toastTitles(app.notifications), {
    visible: ["A1", "A2", "A3"],
    queue: ["A4"],
  });
  return app;
};

test("logout clears on-screen and waiting toasts", async () => {
  const app = await appWithToastsForA();

  await app.auth.getState().logout();

  assert.deepEqual(toastTitles(app.notifications), { visible: [], queue: [] });
});

test("logout with the logout API offline still clears toasts", async () => {
  const app = await appWithToastsForA();
  useNetworkStore.getState().setIsConnected(false, false);
  try {
    // authService.logout's local cleanup, with a failing server call
    await assert.rejects(
      runLogout(
        () => apiClient.post("/api/v1/auth/logout"),
        () => app.auth.getState().logout(),
      ),
    );

    assert.deepEqual(toastTitles(app.notifications), { visible: [], queue: [] });
  } finally {
    useNetworkStore.getState().setIsConnected(true, true);
  }
});

test("User A's request failing after logout shows no toast, then or for User B", async () => {
  const app = await appWithToastsForA();
  // As useFulfillmentActions does: addNotification captured at render, used
  // in a mutation's onError, which TanStack runs even after unmount
  const addNotificationAtRender = app.notifications.getState().addNotification;
  const queryClient = new QueryClient();
  let failRelease!: (e: Error) => void;
  const release = new MutationObserver(queryClient, {
    mutationFn: () => new Promise((_, reject) => (failRelease = reject)),
    onError: () =>
      addNotificationAtRender({ title: "A: Unable to release", message: "", type: "error" }),
  });
  const pending = release.mutate().catch(() => {});
  await settle();

  await app.auth.getState().logout();
  queryClient.clear(); // ProfileLayout / the 401 handler clear the cache too
  failRelease(new Error("timeout")); // settles while logged out
  await pending;
  assert.deepEqual(toastTitles(app.notifications), { visible: [], queue: [] });
  assert.deepEqual(historyTitles(app.notifications), []);

  // Same captured callback after User B has logged in
  await app.auth.getState().login(TOKEN_B);
  await settle();
  notify(app.notifications, "B: order ready");
  addNotificationAtRender({ title: "A: Time extended", message: "", type: "success" });

  assert.deepEqual(toastTitles(app.notifications), { visible: ["B: order ready"], queue: [] });
  assert.deepEqual(historyTitles(app.notifications), ["B: order ready"]);
  await app.auth.getState().logout();
});

test("a stale dismiss from User A's toast doesn't affect User B's toasts", async () => {
  const app = await appWithToastsForA();
  const aToastId = app.notifications.getState().visible[0].id;
  await app.auth.getState().logout();
  await app.auth.getState().login(TOKEN_B);
  await settle();
  for (const n of [1, 2, 3, 4]) {
    app.notifications.getState().addNotification({
      title: `B${n}`, message: "", type: "info", orderId: `b${n}`,
    });
  }

  // e.g. User A's toast exit animation finishing late
  app.notifications.getState().removeNotification(aToastId);

  assert.deepEqual(toastTitles(app.notifications), {
    visible: ["B1", "B2", "B3"],
    queue: ["B4"],
  });
  await app.auth.getState().logout();
});

test("toasts still show, queue and dismiss normally while logged in", async () => {
  const app = await appWithToastsForA();
  const [first] = app.notifications.getState().visible;

  app.notifications.getState().removeNotification(first.id);

  // The waiting toast moves up when one is dismissed
  assert.deepEqual(toastTitles(app.notifications), {
    visible: ["A2", "A3", "A4"],
    queue: [],
  });
  // Re-rendered screens get the current addNotification, which still works
  app.notifications.getState().addNotification({
    title: "A5", message: "", type: "info", orderId: "a5",
  });
  assert.deepEqual(toastTitles(app.notifications).queue, ["A5"]);
  // Pull-to-refresh re-runs initialize(): same session, toasts untouched
  await app.auth.getState().initialize();
  await settle();
  assert.deepEqual(toastTitles(app.notifications), {
    visible: ["A2", "A3", "A4"],
    queue: ["A5"],
  });
  await app.auth.getState().logout();
});
