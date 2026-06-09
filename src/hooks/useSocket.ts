import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { getAccessToken } from '../api/client';
import { API_BASE_URL } from '../utils/urls';

export function useSocket() {
    const accessToken = useAuthStore((s) => s.accessToken);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

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
            auth: { token: getAccessToken() ?? accessToken },
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            if (__DEV__) console.log(`[Socket] Connected to ${API_BASE_URL}`);
            setIsConnected(true);
        });

        if (__DEV__) {
            socket.onAny((event, ...args) => {
                console.log(`[Socket] ← ANY event: "${event}"`, args);
            });
        }

        socket.on('connect_error', (err) => {
            if (__DEV__) console.warn('[Socket] Connection error:', err.message);
            setIsConnected(false);
            // If the server rejected the token, try reconnecting with the latest
            // in-memory token (which apiClient may have refreshed since socket connected)
            if (err.message.toLowerCase().includes('token') || err.message.toLowerCase().includes('auth')) {
                const freshToken = getAccessToken();
                if (freshToken && (socket.auth as any)?.token !== freshToken) {
                    socket.auth = { token: freshToken };
                    socket.connect();
                }
            }
        });

        socket.on('disconnect', (reason) => {
            if (__DEV__) console.warn('[Socket] Disconnected:', reason);
            setIsConnected(false);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [accessToken, isAuthenticated]);

    // Registers a listener and returns a cleanup function.
    // The wrapper is captured so socket.off removes the correct reference.
    const on = useCallback((event: string, callback: (...args: any[]) => void) => {
        const socket = socketRef.current;
        if (!socket) {
            if (__DEV__) console.warn(`[Socket] Cannot listen to "${event}" — socket not connected.`);
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
    }, []);

    const emit = useCallback((event: string, data?: any) => {
        socketRef.current?.emit(event, data);
    }, []);

    return { socket: socketRef.current, isConnected, on, emit };
}
