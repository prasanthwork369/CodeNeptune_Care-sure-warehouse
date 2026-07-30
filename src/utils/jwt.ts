export interface JWTPayload {
  sub: string;
  email: string;
  type: string;
  roles: string[];
  permissions: string[];
  allowedPanels: string[];
  iat: number;
  exp: number;
}

/** Decodes a JWT without verifying the signature. Safe for client-side role extraction. */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    // React Native's atob doesn't handle URL-safe base64 padding — fix it
    const padded = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    return JSON.parse(json) as JWTPayload;
  } catch {
    return null;
  }
};
