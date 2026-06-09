import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosRequestConfig } from 'axios';

const STORAGE_KEY = 'offline_request_queue';
const MAX_SIZE = 50;

interface QueuedRequest {
  config: AxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];

  // Load persisted configs from previous session and re-queue them
  async loadFromStorage(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const configs: AxiosRequestConfig[] = JSON.parse(raw);
      configs.forEach(config => {
        if (this.queue.length < MAX_SIZE) {
          // Restored entries have no live promise — fire-and-forget on replay
          this.queue.push({ config, resolve: () => {}, reject: () => {} });
        }
      });
    } catch {
      // Corrupt storage — ignore and start fresh
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }

  async add(config: AxiosRequestConfig, resolve: any, reject: any): Promise<void> {
    if (this.queue.length >= MAX_SIZE) {
      reject(new Error('Offline queue full — request dropped'));
      return;
    }
    this.queue.push({ config, resolve, reject });
    await this._persist();
  }

  async process(axiosInstance: any): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];
    await AsyncStorage.removeItem(STORAGE_KEY);

    for (const req of batch) {
      try {
        const response = await axiosInstance(req.config);
        req.resolve(response);
      } catch (err) {
        req.reject(err);
      }
    }
  }

  async clear(): Promise<void> {
    this.queue = [];
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  get length(): number {
    return this.queue.length;
  }

  private async _persist(): Promise<void> {
    try {
      const configs = this.queue.map(r => r.config);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    } catch {
      // Storage write failure — non-fatal
    }
  }
}

export const requestQueue = new RequestQueue();
