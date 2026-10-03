import { tokenStorage } from "@/src/lib/storage";
import { API_BASE_URL, API_ENDPOINTS, API_TIMEOUT } from "@/src/utils/urls";
import axios, { AxiosInstance } from "axios";
import { Platform } from "react-native";
import { toAppError } from "@/src/api/errors";
import { requestQueue } from "@/src/utils/requestQueue";
import { useNetworkStore } from "@/src/store/useNetworkStore";

const MUTATION_METHODS = new Set(["post", "put", "patch", "delete"]);

// In-memory token — mirrors window.__ACCESS_TOKEN__ from web client
// Synchronous access avoids async race conditions in the request interceptor
let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (v: string) => void;
  reject: (e: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    // Don't keep the HTTP connection alive after each response. Android only:
    // OkHttp honours a request `Connection: close` and drops the connection
    // from its pool (also over HTTP/2, where the header itself isn't sent).
    // iOS reserves this header (NSURLRequest) and browsers forbid it.
    ...(Platform.OS === "android" && { Connection: "close" }),
  },
});

// Synchronous request interceptor — reads from in-memory token (no async)
apiClient.interceptors.request.use((config) => {
  const { isConnected } = useNetworkStore.getState();
  if (isConnected === false) {
    useNetworkStore.getState().showOfflineAlert();
    return Promise.reject(
      Object.assign(new Error("Network offline"), {
        code: "NETWORK_OFFLINE",
      }),
    );
  }
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  if (__DEV__) (config as any)._startedAt = Date.now();
  return config;
});

// Dev-only live log: one line per finished request, with a running call count
// per endpoint so repeated polling is easy to spot, e.g.
//   [api] ✓ GET  orders/staff/picker-queue   200  276ms   #4
const callCounts = new Map<string, number>();
const logResponse = (config: any, status: number | string) => {
  if (!__DEV__ || !config) return;
  const method = (config.method ?? "get").toUpperCase();
  const path = (config.url ?? "").replace(/^\/?api\/v\d+\//, "");
  const key = `${method} ${path}`;
  const count = (callCounts.get(key) ?? 0) + 1;
  callCounts.set(key, count);
  const ms = config._startedAt ? Date.now() - config._startedAt : "?";
  const ok = typeof status === "number" && status < 400;
  console.log(
    `[api] ${ok ? "✓" : "✗"} ${method.padEnd(6)} ${path.padEnd(32)} ${String(status).padEnd(4)} ${String(ms).padStart(5)}ms  #${count}`,
  );
};

// Response interceptor — offline queue + 401 refresh
apiClient.interceptors.response.use(
  (res) => {
    logResponse(res.config, res.status);
    return res;
  },
  async (err) => {
    const original = err.config;
    logResponse(original, err.response?.status ?? err.code ?? "ERR");

    // ── Offline: queue mutations for replay when connection returns ──────────
    const isNetworkError = !err.response && err.code !== "ECONNABORTED";
    const isMutation = MUTATION_METHODS.has(
      original?.method?.toLowerCase() ?? "",
    );
    const isAuthPath =
      original?.url?.includes("auth/refresh") ||
      original?.url?.includes("auth/logout");

    if (isNetworkError && isMutation && !isAuthPath && !original?._queued) {
      return new Promise((resolve, reject) => {
        requestQueue.add({ ...original, _queued: true }, resolve, reject);
      });
    }

    // ── 401: refresh token and retry ─────────────────────────────────────────

    if (err.response?.status === 401 && !original?._retry && !isAuthPath) {
      if (__DEV__)
        console.log(
          "[apiClient] 401 detected. Attempting background refresh...",
        );
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return apiClient(original);
          })
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}${API_ENDPOINTS.AUTH_REFRESH}`,
          {},
          {
            withCredentials: true,
          },
        );

        const newToken = data.data.accessToken;
        const expiresIn = data.data.expiresIn;

        if (__DEV__) console.log("[apiClient] Background refresh SUCCESS");
        // Update in-memory token + persist to SecureStore
        _accessToken = newToken;
        await tokenStorage.set(newToken);
        if (expiresIn) {
          await tokenStorage.setExpiresAt(Date.now() + expiresIn * 1000);
        }

        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch (e: any) {
        if (__DEV__)
          console.warn(
            "[apiClient] Background refresh FAILED:",
            e?.response?.status ?? e?.message,
          );
        processQueue(e, null);
        // Only force logout if the refresh itself returned 401/403 (invalid/expired refresh token)
        // A 5xx server error should not log the user out
        const refreshStatus = e?.response?.status;
        if (!refreshStatus || refreshStatus === 401 || refreshStatus === 403) {
          _accessToken = null;
          onUnauthorized?.();
        }
        return Promise.reject(toAppError(err));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(toAppError(err));
  },
);

export default apiClient;
