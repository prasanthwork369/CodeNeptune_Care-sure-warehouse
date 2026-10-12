import type { AxiosRequestConfig } from "axios";
import { decodeJWT } from "./jwt";

const STORAGE_KEY = "offline_request_queue";
const MAX_SIZE = 50;

const tokenOwner = (token: string | null | undefined) =>
  token ? (decodeJWT(token)?.sub ?? null) : null;

// apiClient stamps every request with the session's bearer token before it
// can fail and be queued, and the header is persisted with the config, so it
// identifies the user who made the request — also after an app restart.
const requestOwner = (config: AxiosRequestConfig) => {
  const headers = config.headers as Record<string, unknown> | undefined;
  const auth = headers?.Authorization ?? headers?.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ")
    ? tokenOwner(auth.slice("Bearer ".length))
    : null;
};

interface QueuedRequest {
  config: AxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

export interface QueueStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

export class RequestQueue {
  private queue: QueuedRequest[] = [];
  // Bumped by clear(). A replay or storage load that started before a clear
  // (logout) must not send or restore the previous session's requests.
  private generation = 0;

  constructor(
    private getStorage: () => QueueStorage,
    // The current session's access token (apiClient's in-memory token)
    private getAccessToken: () => string | null,
  ) {}

  // Load persisted configs from previous session and re-queue them
  async loadFromStorage(): Promise<void> {
    const generation = this.generation;
    try {
      const raw = await this.getStorage().getItem(STORAGE_KEY);
      if (!raw || generation !== this.generation) return;
      const configs: AxiosRequestConfig[] = JSON.parse(raw);
      configs.forEach((config) => {
        if (this.queue.length < MAX_SIZE) {
          // Restored entries have no live promise — fire-and-forget on replay
          this.queue.push({ config, resolve: () => {}, reject: () => {} });
        }
      });
    } catch {
      // Corrupt storage — ignore and start fresh
      await this.getStorage().removeItem(STORAGE_KEY);
    }
  }

  async add(
    config: AxiosRequestConfig,
    resolve: any,
    reject: any,
  ): Promise<void> {
    if (this.queue.length >= MAX_SIZE) {
      reject(new Error("Offline queue full — request dropped"));
      return;
    }
    this.queue.push({ config, resolve, reject });
    await this._persist();
  }

  async process(axiosInstance: any): Promise<void> {
    if (this.queue.length === 0) return;
    // No one logged in: keep the queue until a session exists to check against
    const owner = tokenOwner(this.getAccessToken());
    if (!owner) return;

    const generation = this.generation;
    const batch = [...this.queue];
    this.queue = [];
    await this.getStorage().removeItem(STORAGE_KEY);

    for (const req of batch) {
      // Cleared mid-replay (logout): drop the rest, as clear() drops the queue
      if (generation !== this.generation) return;
      // Queued by another user (e.g. restored after a logout whose storage
      // delete failed): never send it with the current user's token
      if (requestOwner(req.config) !== owner) {
        req.reject(new Error("Queued request belongs to another session"));
        continue;
      }
      try {
        const response = await axiosInstance(req.config);
        req.resolve(response);
      } catch (err) {
        req.reject(err);
      }
    }
  }

  async clear(): Promise<void> {
    this.generation++;
    this.queue = [];
    try {
      await this.getStorage().removeItem(STORAGE_KEY);
    } catch {
      // Storage failure — the in-memory queue is already empty
    }
  }

  get length(): number {
    return this.queue.length;
  }

  private async _persist(): Promise<void> {
    try {
      const configs = this.queue.map((r) => r.config);
      await this.getStorage().setItem(STORAGE_KEY, JSON.stringify(configs));
    } catch {
      // Storage write failure — non-fatal
    }
  }
}

// Required lazily so the queue logic can be unit-tested outside React Native,
// and because api/client imports this module (circular at load time)
/* eslint-disable @typescript-eslint/no-require-imports */
export const requestQueue = new RequestQueue(
  () => require("@react-native-async-storage/async-storage").default,
  () => require("../api/client").getAccessToken(),
);
/* eslint-enable @typescript-eslint/no-require-imports */
