import { tokenStorage } from "@/src/lib/storage";
import { API_BASE_URL, API_ENDPOINTS, API_TIMEOUT } from "@/src/utils/urls";
import axios, { AxiosInstance } from "axios";
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
  return config;
});

// Response interceptor — offline queue + 401 refresh
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

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
