import test from "node:test";
import assert from "node:assert/strict";
import Module from "node:module";

// Runs the real apiClient, requestQueue, fulfillmentApi and dispatcherApi.
// Only native modules are replaced, at the Node module loader, before those load.
/* eslint-disable @typescript-eslint/no-require-imports */
const asyncStorageData = new Map<string, string>();
const nativeStubs: Record<string, unknown> = {
  "react-native": {
    Platform: { OS: "android" },
    AppState: { currentState: "background" },
  },
  "expo-secure-store": {
    setItemAsync: async () => {},
    getItemAsync: async () => null,
    deleteItemAsync: async () => {},
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

const { apiClient } = require("../client");
const { requestQueue } = require("../../utils/requestQueue");
const { useNetworkStore } = require("../../store/useNetworkStore");
const { API_ENDPOINTS } = require("../../utils/urls");
const { fulfillmentApi } = require("../../features/picker/api/fulfillment.api");
const {
  dispatcherApi,
} = require("../../features/dispatcher/api/dispatcher.api");
const axios = require("axios");
/* eslint-enable @typescript-eslint/no-require-imports */

const QUEUE_KEY = "offline_request_queue";
const ORDER_UUID = "3f2b8c1e-6a4d-4e2f-9b7a-1c0d5e8f9a21";

type Config = { url: string; method: string; data: unknown };

// Records what reached the adapter, i.e. the real axios request config
let sent: Config[] = [];
const ok = async (config: Config) => {
  sent.push(config);
  return { status: 200, statusText: "OK", data: {}, headers: {}, config };
};
const networkDrop = async (config: Config) => {
  sent.push(config);
  // No response: the connection dropped mid-request
  throw new axios.AxiosError("Network Error", "ERR_NETWORK", config, {});
};

// A queued request's promise stays pending until replay; settle check only
const isPending = async (p: Promise<unknown>) => {
  const PENDING = Symbol("pending");
  const result = await Promise.race([
    p.then(
      () => "settled",
      () => "settled",
    ),
    new Promise((r) => setImmediate(() => r(PENDING))),
  ]);
  return result === PENDING;
};

test.beforeEach(async () => {
  sent = [];
  await requestQueue.clear();
  asyncStorageData.clear();
  useNetworkStore.setState({
    isConnected: true,
    isInternetReachable: true,
    offlineAlertVisible: false,
  });
});

const cases = [
  {
    name: "startPack",
    start: (id: string) => fulfillmentApi.startPack(id),
    url: `/api/v1/fulfillment/orders/${ORDER_UUID}/pack/start`,
  },
  {
    name: "startDispatch",
    start: (id: string) => dispatcherApi.startDispatch(id),
    url: `/api/v1/fulfillment/orders/${ORDER_UUID}/dispatch/start`,
  },
];

test("start endpoint constants build the step-start URLs", () => {
  assert.equal(API_ENDPOINTS.FULFILLMENT_PACK_START(ORDER_UUID), cases[0].url);
  assert.equal(
    API_ENDPOINTS.FULFILLMENT_DISPATCH_START(ORDER_UUID),
    cases[1].url,
  );
});

for (const { name, start, url } of cases) {
  test(`${name} sends a bodyless POST to the start URL`, async () => {
    apiClient.defaults.adapter = ok;

    await start(ORDER_UUID);

    assert.equal(sent.length, 1);
    assert.equal(sent[0].method, "post");
    assert.equal(sent[0].url, url);
    assert.equal(sent[0].data, undefined);
  });

  test(`${name} + network error rejects and is not queued or persisted`, async () => {
    apiClient.defaults.adapter = networkDrop;

    const request = start(ORDER_UUID);
    // Queued, it would stay pending and replay later with a wrong start time
    assert.equal(await isPending(request), false, "start call was queued");
    await assert.rejects(request);

    assert.equal(sent.length, 1);
    assert.equal(requestQueue.length, 0);
    assert.equal(asyncStorageData.has(QUEUE_KEY), false);
  });
}
