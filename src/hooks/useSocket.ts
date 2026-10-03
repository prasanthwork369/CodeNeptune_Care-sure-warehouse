import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";
import { getAccessToken } from "../api/client";
import { authApi } from "../features/auth/api/auth.api";
import { API_BASE_URL } from "../utils/urls";

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Bumped each time the socket comes back after a real disconnect, so
  // consumers can resync data whose events may have been missed meanwhile
  const [reconnectCount, setReconnectCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const socket = io(API_BASE_URL, {
      // Evaluated on every connect/reconnect, so the handshake always carries
      // the latest token apiClient holds (access tokens expire after ~15 min)
      auth: (cb) => cb({ token: getAccessToken() ?? accessToken }),
      // Keep retrying (backoff 1s → 5s max) — a finite limit left the socket
      // dead for the rest of the session after a short network outage
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    // Per socket instance: a new socket (login / token change) is a first
    // connect, not a reconnect
    let hasConnected = false;
    // Auth-rejection recovery state for this socket instance
    let authRecovering = false;
    let disposed = false;
    socket.on("connect", () => {
      if (__DEV__) console.log(`[Socket] Connected to ${API_BASE_URL}`);
      authRecovering = false;
      setIsConnected(true);
      if (hasConnected) setReconnectCount((n) => n + 1);
      hasConnected = true;
    });

    if (__DEV__) {
      socket.onAny((event, ...args) => {
        console.log(`[Socket] ← ANY event: "${event}"`, args);
      });
    }

    socket.on("connect_error", (err) => {
      if (__DEV__) console.warn("[Socket] Connection error:", err.message);
      setIsConnected(false);
      // The gateway rejected the handshake token (expired/invalid). Socket.IO
      // does not auto-reconnect after a server-side auth rejection, so refresh
      // the token through apiClient's existing 401 → refresh path (getMe) and
      // reconnect this same socket once. A second rejection right after that
      // stops here — no loop; a failed refresh is handled by apiClient's
      // logout path, which tears this socket down.
      if (!err.message.toLowerCase().startsWith("authentication error")) return;
      if (authRecovering) {
        authRecovering = false;
        return;
      }
      authRecovering = true;
      authApi
        .getMe()
        .then(() => {
          if (!disposed) socket.connect();
        })
        .catch(() => {
          authRecovering = false;
        });
    });

    socket.on("disconnect", (reason) => {
      if (__DEV__) console.warn("[Socket] Disconnected:", reason);
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      disposed = true;
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [accessToken, isAuthenticated]);

  // Registers a listener and returns a cleanup function.
  // The wrapper is captured so socket.off removes the correct reference.
  const on = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      const socket = socketRef.current;
      if (!socket) {
        if (__DEV__)
          console.warn(
            `[Socket] Cannot listen to "${event}" — socket not connected.`,
          );
        return;
      }

      const wrapper = (data: any) => {
        if (__DEV__) console.log(`[Socket] Event "${event}":`, data);
        callback(data);
      };

      socket.on(event, wrapper);
      return () => {
        socket.off(event, wrapper);
      };
    },
    [],
  );

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { socket: socketRef.current, isConnected, reconnectCount, on, emit };
}
