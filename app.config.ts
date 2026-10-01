import { load as loadEnv } from "@expo/env";
import type { ConfigContext, ExpoConfig } from "expo/config";

// Gradle's Expo steps can read this config without loading .env files.
// This never overrides variables already supplied by EAS.
loadEnv(__dirname, { silent: true });

const APP_ENVS = ["development", "preview", "production"];
const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? "development";

if (!APP_ENVS.includes(appEnv)) {
  throw new Error(
    `EXPO_PUBLIC_APP_ENV must be one of ${APP_ENVS.join(", ")} (got: ${appEnv}).`,
  );
}

// EAS CLI reads config for project metadata with dotenv disabled. That read
// does not bundle or run the application, so the API URL is not needed there.
const isEasCliMetadataRead =
  process.env.EXPO_NO_DOTENV === "1" && process.env.EAS_BUILD !== "true";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!apiBaseUrl && !isEasCliMetadataRead) {
  throw new Error(
    `Missing EXPO_PUBLIC_API_BASE_URL for APP_ENV "${appEnv}". Set it in the EAS environment or .env.local (see .env.example).`,
  );
}

if (
  appEnv === "production" &&
  apiBaseUrl &&
  !apiBaseUrl.startsWith("https://")
) {
  throw new Error(
    `EXPO_PUBLIC_API_BASE_URL must be an https:// URL in production (got: ${apiBaseUrl}).`,
  );
}

export default ({ config }: ConfigContext): ExpoConfig =>
  ({
    ...config,
    extra: {
      ...config.extra,
      appEnv,
    },
  }) as ExpoConfig;
