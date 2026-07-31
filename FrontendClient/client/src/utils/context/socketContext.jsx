import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import env from '../config/env';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
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
        const tenantSlug = localStorage.getItem('tenantSlug') || localStorage.getItem('tenant_slug') || 'default';

        console.log('[Socket] Connecting to:', socketUrl, 'tenant:', tenantSlug);

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
                'x-tenant-slug': tenantSlug,
            }
        });

        socketInstance.on('connect', () => {
            console.log('✅ Socket connected:', socketInstance.id);
            setConnected(true);
            setReconnecting(false);

            // Join tenant room for notifications
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};
            const userId = user?.user_id || user?.userId || user?.id || null;
            const userRole = user?.role || null;

            console.log('[Socket] Connection details:', { 
                socketId: socketInstance.id, 
                tenantSlug, 
                userId, 
                userRole,
                hasUser: !!userStr 
            });

            // Primary join event (kebab-case for central socketio-service)
            if (tenantSlug && userId) {
                try {
                    socketInstance.emit('join-tenant', { 
                        tenantSlug, 
                        userId, 
                        userRole,
                        timestamp: new Date().toISOString()
                    }, (response) => {
                        // Callback to confirm join
                        console.log('[Socket] Join tenant response:', response);
                    });
                    console.log('[Socket] Emitted join-tenant:', { tenantSlug, userId, userRole });
                } catch (e) { 
                    console.warn('[Socket] Failed to emit join-tenant:', e); 
                }
            } else {
                console.warn('[Socket] Cannot join tenant room - missing tenantSlug or userId:', { 
                    tenantSlug, 
                    userId,
                    hasUser: !!userStr 
                });
            }

            // Join branch rooms for scoped notifications
            const branchId = localStorage.getItem('branchId') || localStorage.getItem('branch_id');
            if (branchId) {
                try {
                    socketInstance.emit('join-branch', { tenantSlug, branchId });
                    console.log('[Socket] Joined branch:', { branchId });
                } catch (e) { 
                    console.warn('[Socket] Failed to join branch:', e); 
                }
            }

            // Fetch notifications after connecting
            console.log('[Socket] Connection established, notifications should now work');
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

            // Re-join tenant room after reconnection
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};
            const userId = user?.user_id || user?.userId || user?.id || null;
            const userRole = user?.role || null;

            if (tenantSlug && userId) {
                try {
                    socketInstance.emit('join-tenant', { 
                        tenantSlug, 
                        userId, 
                        userRole,
                        timestamp: new Date().toISOString()
                    });
                    console.log('[Socket] Re-joined tenant after reconnect:', { tenantSlug, userId });
                } catch (e) { 
                    console.warn('[Socket] Failed to re-join tenant:', e); 
                }
            }
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

        setSocket(socketInstance);

        // Cleanup on unmount
        return () => {
            console.log('[Socket] Disconnecting socket');
            if (socketInstance) {
                socketInstance.removeAllListeners();
                socketInstance.disconnect();
            }
        };
    }, []);

    const joinBranch = useCallback((branchId) => {
        if (socket && branchId) {
            const tenantSlug = localStorage.getItem('tenantSlug') || 'default';
            socket.emit('join-branch', { tenantSlug, branchId });
        }
    }, [socket]);

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