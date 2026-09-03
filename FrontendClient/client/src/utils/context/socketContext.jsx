import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import env from '../config/env';
import { getSocketAuth, refreshSocketAuth } from '../socket/socketAuth';


const SocketContext = createContext(null);

// Safe no-op fallback returned when a component calls useSocket outside the
// provider (e.g. a stale HMR chunk or a mount-order edge case). Instead of
// crashing the whole app with "useSocket must be used within a SocketProvider",
// the component keeps rendering and simply receives no real-time events.
const SOCKET_FALLBACK = Object.freeze({
    socket: null,
    connected: false,
    reconnecting: false,
    connectionError: null,
    joinBranch: () => {},
    joinAdmin: () => {},
});

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        console.warn(
            '[Socket] useSocket used outside <SocketProvider> — returning a no-op fallback ' +
            '(real-time events disabled for this component). If this happens on a fresh ' +
            'page load, restart the dev server to clear stale HMR chunks.'
        );
        return SOCKET_FALLBACK;
    }

    return context;
};

/**
 * Retrieves the best available socket URL based on environment.
 * The socketio-service handles ALL real-time events (notifications, bookings, etc.)
 * It runs on port 5018 in development.
 */
const getSocketUrl = () => {
    // Priority: env config > environment detection > default
    if (env.SOCKET_URL) {
        console.log('[Socket] Using configured SOCKET_URL:', env.SOCKET_URL);
        return env.SOCKET_URL;
    }

    // Production: use the dedicated WebSocket subdomain
    if (import.meta.env.PROD) {
        const url = 'wss://ws.restpoint.co.ke';
        console.log('[Socket] Production URL:', url);
        return url;
    }

    // Development: always use socketio-service on port 5018
    const url = 'http://localhost:5018';
    console.log('[Socket] Development URL:', url);
    return url;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const [connectionError, setConnectionError] = useState(null);

    useEffect(() => {
        const socketUrl = getSocketUrl();

        console.log('[Socket] Connecting to:', socketUrl);

        // Connect to Socket.IO server (central socketio-service)
        // The socketio-service handshake middleware REQUIRES a token in
        // production (401 "Authentication required" otherwise). getSocketAuth()
        // always attaches the freshest token + tenant + user id, and every
        // reconnect_attempt below re-reads it so it never goes stale.
        const socketInstance = io(socketUrl, {
            // Polling FIRST, WebSocket second. Starting with 'websocket' made
            // every handshake a hard failure whenever a proxy in the path
            // (host nginx, Cloudflare) dropped or misrouted the upgrade — the
            // client surfaced a bare "websocket error" with no detail. Polling
            // is plain HTTP(S) and works through any correctly configured
            // proxy; Engine.IO then transparently UPGRADES to WebSocket once
            // both ends agree it can. If the upgrade fails the socket stays
            // connected on polling instead of dying.
            transports: ['polling', 'websocket'],
            // Must match the server's Socket.IO path (server default: /socket.io/).
            path: env.SOCKET_PATH || '/socket.io/',
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 20,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            withCredentials: false,
            auth: getSocketAuth(),
            extraHeaders: {
                'x-tenant-slug':
                    localStorage.getItem('tenantSlug') ||
                    localStorage.getItem('tenant_slug') ||
                    'default',
            },
        });

        const emitJoinTenant = () => {
            // Parse the stored user FIRST — it is the authoritative source for
            // the branch slug, parent slug, id and role.
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};
            const userId = user?.user_id || user?.userId || user?.id || null;
            const userRole = user?.role || null;
            const parentTenantSlug =
                user?.parentTenantSlug ||
                localStorage.getItem('parentTenantSlug') ||
                localStorage.getItem('tenantSlug') ||
                localStorage.getItem('tenant_slug') ||
                null;
            // Branch users join their OWN branch room (complete branch slug,
            // e.g. org-home-machakos) so branch-targeted notifications (inter-
            // branch stock requests, transfers) reach ONLY that branch — plus
            // the parent room for org-wide notifications.
            const userBranchSlug =
                user?.branchSlug ||
                localStorage.getItem('branchSlug') ||
                null;
            const currentTenantSlug = userBranchSlug || parentTenantSlug || 'default';

            console.log('[Socket] Connection details:', {
                socketId: socketInstance.id,
                tenantSlug: currentTenantSlug,
                userId,
                userRole,
                parentTenantSlug,
                hasUser: !!userStr,
            });

            if (currentTenantSlug && userId) {
                try {
                    socketInstance.emit(
                        'join-tenant',
                        {
                            tenantSlug: currentTenantSlug,
                            userId,
                            userRole,
                            parentTenantSlug,
                            timestamp: new Date().toISOString(),
                        },
                        (response) => {
                            console.log('[Socket] Join tenant response:', response);
                        }
                    );
                    console.log('[Socket] Emitted join-tenant:', {
                        tenantSlug: currentTenantSlug,
                        userId,
                        userRole,
                        parentTenantSlug,
                    });
                } catch (e) {
                    console.warn('[Socket] Failed to emit join-tenant:', e);
                }
            } else {
                console.warn(
                    '[Socket] Cannot join tenant room - missing tenantSlug or userId:',
                    {
                        tenantSlug: currentTenantSlug,
                        userId,
                        hasUser: !!userStr,
                    }
                );
            }
        };

        socketInstance.on('connect', () => {
            console.log('✅ Socket connected:', socketInstance.id);
            setConnected(true);
            setReconnecting(false);
            setConnectionError(null);
            emitJoinTenant();
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            setConnected(false);
            if (reason === 'io server disconnect' || reason === 'transport close') {
                setReconnecting(true);
            }
        });

        socketInstance.on('connect_error', (error) => {
            // Log EVERYTHING. A bare "websocket error" message is useless —
            // engine.io attaches .description and .context (HTTP status of the
            // failed handshake request) which pinpoint the actual cause.
            const status = error?.context?.status ?? error?.description?.status;
            const transportName = socketInstance?.io?.engine?.transport?.name;
            console.error('[Socket] Connection error:', {
                message: error?.message,
                description: error?.description,
                type: error?.type,
                httpStatus: status,
                transport: transportName,
                url: socketUrl,
                path: env.SOCKET_PATH || '/socket.io/',
            });
            // Actionable hints for the three failure modes we actually hit.
            if (status === 401 || status === 403) {
                console.error(
                    '[Socket] Handshake rejected by the server (auth). Refreshing token and retrying on next attempt.'
                );
                refreshSocketAuth(socketInstance);
            } else if (status === 502 || status === 504) {
                console.error(
                    '[Socket] 502/504 from the proxy: nginx cannot reach the socketio-service. ' +
                    'Check the upstream port — PROD publishes it on host port 5013 (container 5000); ' +
                    '5018 is the DEV port.'
                );
            } else if (!status) {
                console.error(
                    '[Socket] No HTTP response at all: /socket.io/ is probably NOT reaching the socket ' +
                    'server (SPA fallback serving index.html, or the upgrade is being dropped). Verify ' +
                    "with: curl -i '" + socketUrl + "/socket.io/?EIO=4&transport=polling' — it must return " +
                    "a body starting with 0{\"sid\":...}, NEVER HTML."
                );
            }
            setConnectionError(error?.message || 'connection error');
            setConnected(false);
        });

        socketInstance.on('reconnect', (attemptNumber) => {
            console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
            setConnected(true);
            setReconnecting(false);
            emitJoinTenant();
        });

        socketInstance.on('reconnect_attempt', (attemptNumber) => {
            // Re-read storage so every retry carries the CURRENT access token.
            // Tokens rotate every ~10 minutes; without this the handshake
            // replays the (possibly empty) token captured at mount and the
            // server keeps rejecting with 401 "Authentication required".
            refreshSocketAuth(socketInstance);
            console.log('[Socket] Reconnect attempt', attemptNumber, '(auth refreshed)');
            setReconnecting(true);
        });

        socketInstance.on('reconnect_error', (error) => {
            console.error('[Socket] Reconnection error:', error.message);
        });

        socketInstance.on('reconnect_failed', () => {
            console.error('❌ Socket reconnection failed after all attempts');
            setConnected(false);
            setReconnecting(false);
        });

        // Listen for welcome message
        socketInstance.on('connected', (data) => {
            console.log('[Socket] Server welcome:', data);
        });

        // Re-join tenant room when auth state changes (e.g. after login
        // without a full page reload). AuthContext dispatches a custom event
        // after it persists the new user + tenantSlug to localStorage.
        const handleAuthChange = () => {
            // Login/refresh just happened — reload the handshake credentials
            // so the socket stops failing with 401 and (re)connect immediately
            // if it was never authenticated (e.g. provider mounted pre-login).
            refreshSocketAuth(socketInstance);
            if (!socketInstance.connected) {
                socketInstance.connect();
            }
            emitJoinTenant();
        };
        window.addEventListener('auth-state-changed', handleAuthChange);

        // Reconnect immediately when the network or tab comes back instead of
        // waiting out the backoff timer — sockets die silently during sleep,
        // offline periods and mobile backgrounding.
        const handleOnline = () => {
            console.log('[Socket] Network back online — reconnecting now');
            refreshSocketAuth(socketInstance);
            if (!socketInstance.connected) socketInstance.connect();
        };
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !socketInstance.connected) {
                console.log('[Socket] Tab visible again — reconnecting now');
                refreshSocketAuth(socketInstance);
                socketInstance.connect();
            }
        };
        window.addEventListener('online', handleOnline);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        setSocket(socketInstance);

        // Cleanup on unmount
        return () => {
            console.log('[Socket] Disconnecting socket');
            window.removeEventListener('auth-state-changed', handleAuthChange);
            window.removeEventListener('online', handleOnline);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (socketInstance) {
                socketInstance.removeAllListeners();
                socketInstance.disconnect();
            }
        };
    }, []);

    const joinBranch = useCallback(
        (branchId) => {
            if (socket && branchId) {
                const tenantSlug =
                    localStorage.getItem('tenantSlug') || 'default';
                socket.emit('join-branch', { tenantSlug, branchId });
            }
        },
        [socket]
    );

    const joinAdmin = useCallback(() => {
        if (socket) {
            socket.emit('join-admin');
        }
    }, [socket]);

    const value = {
        socket,
        connected,
        reconnecting,
        connectionError,
        joinBranch,
        joinAdmin,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};