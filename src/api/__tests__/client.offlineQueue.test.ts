import test from "node:test";
import assert from "node:assert/strict";
import Module from "node:module";
import fs from "node:fs";
import path from "node:path";

// React Native's own FormData class (Flow source, stripped here) installed as
// the global before anything loads — as RN's setUpXHR does — so axios and
// apiClient see exactly the FormData the app sends uploads with
/* eslint-disable @typescript-eslint/no-require-imports */
const loadReactNativeFormData = () => {
  const babel = require("@babel/core");
  const file = path.resolve(
    "node_modules/react-native/Libraries/Network/FormData.js",
  );
  const { code } = babel.transformSync(fs.readFileSync(file, "utf8"), {
    filename: file,
    babelrc: false,
    configFile: false,
    plugins: [
      "@babel/plugin-transform-flow-strip-types",
      "@babel/plugin-transform-modules-commonjs",
    ],
  });
  const mod = { exports: {} as { default: typeof FormData } };
  new Function("module", "exports", code)(mod, mod.exports);
  return mod.exports.default;
};
const RNFormData = loadReactNativeFormData();
(globalThis as { FormData: unknown }).FormData = RNFormData;

// Runs the real apiClient, requestQueue and userService. Only native modules
// are replaced, at the Node module loader, before those load.
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
const { AppError } = require("../errors");
const { requestQueue } = require("../../utils/requestQueue");
const { useNetworkStore } = require("../../store/useNetworkStore");
const { userService } = require("../../features/profile/services/user.service");
const axios = require("axios");
/* eslint-enable @typescript-eslint/no-require-imports */

const QUEUE_KEY = "offline_request_queue";

type Config = { url: string; method: string; data: unknown };

// Records what reached the adapter, i.e. the real axios request config
let sent: Config[] = [];
const networkDrop = async (config: Config) => {
  sent.push(config);
  // No response: the connection dropped mid-request
  throw new axios.AxiosError("Network Error", "ERR_NETWORK", config, {});
};
const serverError =
  (status: number, message: string) => async (config: Config) => {
    sent.push(config);
    throw new axios.AxiosError(
      `Request failed with status code ${status}`,
      "ERR_BAD_RESPONSE",
      config,
      {},
      { status, statusText: "", data: { message }, headers: {}, config },
    );
  };

// Profile photo upload exactly as useImageUpload starts it
const uploadAvatar = () =>
  userService.uploadAvatar("file:///cache/avatar.jpg", "avatar.jpg", "image/jpeg");

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

test("multipart upload + network error rejects and is not queued or persisted", async () => {
  apiClient.defaults.adapter = networkDrop;

  const upload = uploadAvatar();
  // Queued, it would stay pending and useImageUpload would spin until replay
  assert.equal(await isPending(upload), false, "upload stuck in offline queue");
  await assert.rejects(upload, (err: Error) => {
    assert.ok(err instanceof AppError);
    assert.equal((err as InstanceType<typeof AppError>).kind, "network");
    // useImageUpload shows its "No internet connection" alert for this
    assert.match(err.message, /Network/);
    return true;
  });

  // The interceptor saw the real RN FormData body on axios's error config
  assert.equal(sent.length, 1);
  assert.equal(sent[0].url, "/api/v1/storage/upload");
  assert.ok(sent[0].data instanceof RNFormData);
  assert.equal(requestQueue.length, 0);
  assert.equal(asyncStorageData.has(QUEUE_KEY), false);
});

test("JSON POST + network error is still queued and persisted", async () => {
  apiClient.defaults.adapter = networkDrop;

  const request = apiClient.post("/api/v1/fulfillment/orders/1/claim", {
    note: "x",
  });

  assert.equal(await isPending(request), true);
  assert.equal(requestQueue.length, 1);
  const saved = JSON.parse(asyncStorageData.get(QUEUE_KEY)!);
  assert.equal(saved[0].method, "post");
  assert.equal(saved[0].url, "/api/v1/fulfillment/orders/1/claim");
});

test("JSON PATCH + network error (e.g. saving avatarUrl) is still queued", async () => {
  apiClient.defaults.adapter = networkDrop;

  const request = apiClient.patch("/api/v1/users/user-1", {
    avatarUrl: "https://cdn/x.jpg",
  });

  assert.equal(await isPending(request), true);
  assert.equal(requestQueue.length, 1);
  const saved = JSON.parse(asyncStorageData.get(QUEUE_KEY)!);
  assert.equal(saved[0].method, "patch");
  assert.equal(JSON.parse(saved[0].data).avatarUrl, "https://cdn/x.jpg");
});

for (const [status, kind] of [
  [422, "validation"],
  [500, "server"],
] as const) {
  test(`multipart upload + HTTP ${status} propagates the server error, not queued`, async () => {
    apiClient.defaults.adapter = serverError(status, "Upload rejected");

    await assert.rejects(uploadAvatar(), (err: Error) => {
      assert.ok(err instanceof AppError);
      const appErr = err as InstanceType<typeof AppError>;
      assert.equal(appErr.kind, kind);
      assert.equal(appErr.status, status);
      assert.equal(appErr.message, "Upload rejected");
      return true;
    });
    assert.equal(sent.length, 1);
    assert.equal(requestQueue.length, 0);
    assert.equal(asyncStorageData.has(QUEUE_KEY), false);
  });
}

test("why uploads cannot be queued: persisting RN FormData drops the file", () => {
  const body = new RNFormData();
  body.append("file", { uri: "file:///cache/avatar.jpg", name: "a.jpg", type: "image/jpeg" } as any);

  const restored = JSON.parse(JSON.stringify({ data: body })).data;

  assert.ok(!(restored instanceof RNFormData));
  assert.deepEqual(Object.keys(restored), ["_parts"]);
});
