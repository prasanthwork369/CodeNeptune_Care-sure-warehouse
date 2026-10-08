// Dev-only live API logger
// Logs outgoing request, execution duration, response data, and error payload in pretty-printed JSON

const callCounts = new Map<string, number>();

/**
 * Safely format any data into human-readable pretty-printed JSON (indent: 2)
 */
const formatJson = (data: any): string => {
  if (data === undefined || data === null) return String(data);
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return data;
    }
  }
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

/**
 * Logs outgoing API request in development mode (__DEV__).
 */
export const logApiRequest = (config: any) => {
  if (!__DEV__ || !config) return;

  config._startedAt = Date.now();
  const method = (config.method ?? "get").toUpperCase();
  const path = (config.url ?? "").replace(/^\/?api\/v\d+\//, "");

  console.log(`[api] 🚀 ${method.padEnd(6)} ${path}`);

  if (config.params && Object.keys(config.params).length > 0) {
    console.log("  ↳ [Params]:\n" + formatJson(config.params));
  }

  if (config.data) {
    console.log("  ↳ [Body]:\n" + formatJson(config.data));
  }
};

/**
 * Logs successful API response with duration and pretty-printed payload in development mode (__DEV__).
 */
export const logApiResponse = (res: any) => {
  if (!__DEV__ || !res?.config) return;

  const config = res.config;
  const method = (config.method ?? "get").toUpperCase();
  const path = (config.url ?? "").replace(/^\/?api\/v\d+\//, "");
  const key = `${method} ${path}`;
  const count = (callCounts.get(key) ?? 0) + 1;
  callCounts.set(key, count);

  const ms = config._startedAt ? Date.now() - config._startedAt : "?";

  console.log(
    `[api] ✓ ${method.padEnd(6)} ${path.padEnd(32)} ${String(res.status).padEnd(4)} ${String(ms).padStart(5)}ms  #${count}`,
  );

  if (res.data !== undefined) {
    console.log("  ↳ [Response]:\n" + formatJson(res.data));
  }
};

/**
 * Logs failed API response with error status, duration, and pretty-printed error payload in development mode (__DEV__).
 */
export const logApiError = (err: any) => {
  if (!__DEV__ || !err?.config) return;

  const config = err.config;
  const method = (config.method ?? "get").toUpperCase();
  const path = (config.url ?? "").replace(/^\/?api\/v\d+\//, "");
  const key = `${method} ${path}`;
  const count = (callCounts.get(key) ?? 0) + 1;
  callCounts.set(key, count);

  const ms = config._startedAt ? Date.now() - config._startedAt : "?";
  const status = err.response?.status ?? err.code ?? "ERR";

  console.log(
    `[api] ✗ ${method.padEnd(6)} ${path.padEnd(32)} ${String(status).padEnd(4)} ${String(ms).padStart(5)}ms  #${count}`,
  );

  if (err.response?.data !== undefined) {
    console.log("  ↳ [Error Response]:\n" + formatJson(err.response.data));
  } else if (err.message) {
    console.log("  ↳ [Error Message]", err.message);
  }
};
