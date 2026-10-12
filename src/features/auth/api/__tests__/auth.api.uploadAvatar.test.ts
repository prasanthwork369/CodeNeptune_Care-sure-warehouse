import test from "node:test";
import assert from "node:assert/strict";
import Module from "node:module";

// Runs the real authApi and apiClient (interceptors, toAppError). Only native
// modules are replaced, at the Node module loader, before those load.
const nativeStubs: Record<string, unknown> = {
  "react-native": { Platform: { OS: "android" } },
  "expo-secure-store": {
    setItemAsync: async () => {},
    getItemAsync: async () => null,
    deleteItemAsync: async () => {},
  },
  "@react-native-async-storage/async-storage": {
    __esModule: true,
    default: {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
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
const { authApi } = require("../auth.api");
const { apiClient } = require("../../../../api/client");
const { AppError } = require("../../../../api/errors");
const { useNetworkStore } = require("../../../../store/useNetworkStore");
const { requestQueue } = require("../../../../utils/requestQueue");
const axios = require("axios");
/* eslint-enable @typescript-eslint/no-require-imports */

type Config = { url: string; method: string };
const respond =
  (status: number, data: unknown) => async (config: Config) => {
    const response = { status, statusText: "", data, headers: {}, config };
    if (status >= 200 && status < 300) return response;
    throw new axios.AxiosError(
      `Request failed with status code ${status}`,
      "ERR_BAD_RESPONSE",
      config,
      null,
      response,
    );
  };

const upload = () => authApi.uploadAvatar(new FormData());

test.beforeEach(() => {
  useNetworkStore.setState({ isConnected: true, offlineAlertVisible: false });
});

test("successful upload returns the API's response body", async () => {
  const body = { success: true, data: { avatarUrl: "https://cdn/x.jpg" } };
  const sent: Config[] = [];
  apiClient.defaults.adapter = async (config: Config) => {
    sent.push(config);
    return respond(200, body)(config);
  };

  assert.deepEqual(await upload(), body);
  // Endpoint and method unchanged
  assert.equal(sent.length, 1);
  assert.equal(sent[0].method, "post");
  assert.equal(sent[0].url, "/api/v1/users");
});

test("HTTP error rejects with the server's message, not a success result", async () => {
  apiClient.defaults.adapter = respond(500, { message: "Storage unavailable" });

  await assert.rejects(upload(), (err: InstanceType<typeof AppError>) => {
    assert.ok(err instanceof AppError);
    assert.equal(err.kind, "server");
    assert.equal(err.status, 500);
    assert.equal(err.message, "Storage unavailable");
    return true;
  });
});

test("validation error (422) rejects as a validation AppError", async () => {
  apiClient.defaults.adapter = respond(422, { message: "File too large" });

  await assert.rejects(upload(), { kind: "validation", message: "File too large" });
});

test("offline device rejects with a network error, not a success result", async () => {
  let requests = 0;
  apiClient.defaults.adapter = async (config: Config) => {
    requests++;
    return respond(200, { success: true })(config);
  };
  useNetworkStore.setState({ isConnected: false });

  await assert.rejects(upload(), (err: Error) => {
    assert.ok(err instanceof AppError);
    assert.match(err.message, /Network/); // useImageUpload's offline message
    return true;
  });
  assert.equal(requests, 0);
});

test("connection dropped mid-request never resolves as success", async () => {
  apiClient.defaults.adapter = async (config: Config) => {
    throw new axios.AxiosError("Network Error", "ERR_NETWORK", config, null);
  };

  // Multipart bodies are never queued (JSON persistence would drop the file),
  // so the upload rejects instead of waiting for a replay
  await assert.rejects(upload(), { kind: "network" });
  assert.equal(requestQueue.length, 0);
});

test("unexpected exception rejects as an AppError, like other apiClient calls", async () => {
  apiClient.defaults.adapter = async () => {
    throw new TypeError("boom");
  };

  await assert.rejects(upload(), (err: Error) => {
    assert.ok(err instanceof AppError);
    assert.equal((err as InstanceType<typeof AppError>).kind, "unknown");
    assert.equal(err.message, "boom");
    return true;
  });
});
