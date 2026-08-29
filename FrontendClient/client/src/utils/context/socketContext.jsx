import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import env from '../config/env';

const SocketContext = createContext(null);

// Safe no-op fallback returned when a component calls useSocket outside the
// provider (e.g. a stale HMR chunk or a mount-order edge case). Instead of
// crashing the whole app with "useSocket must be used within a SocketProvider",
// the component keeps rendering and simply receives no real-time events.
const SOCKET_FALLBACK = Object.freeze({
    socket: null,
    connected: false,
    reconnecting: false,
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

    // Production: use the same host as the application
    if (import.meta.env.PROD) {
        const url = 'https://restpoint.co.ke';
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

    useEffect(() => {
        const socketUrl = getSocketUrl();

        console.log('[Socket] Connecting to:', socketUrl);

        // Connect to Socket.IO server (central socketio-service)
        const socketInstance = io(socketUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 20,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            withCredentials: false,
            auth: {
                token: localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '',
            },
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
            console.error('[Socket] Connection error:', error.message);
            setConnected(false);
        });

        socketInstance.on('reconnect', (attemptNumber) => {
            console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
            setConnected(true);
            setReconnecting(false);
            emitJoinTenant();
        });

        socketInstance.on('reconnect_attempt', (attemptNumber) => {
            console.log('[Socket] Reconnect attempt', attemptNumber);
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
            emitJoinTenant();
        };
        window.addEventListener('auth-state-changed', handleAuthChange);

        setSocket(socketInstance);

        // Cleanup on unmount
        return () => {
            console.log('[Socket] Disconnecting socket');
            window.removeEventListener('auth-state-changed', handleAuthChange);
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
        joinBranch,
        joinAdmin,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};