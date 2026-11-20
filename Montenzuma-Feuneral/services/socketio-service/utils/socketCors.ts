
import { Server as SocketIOServer } from 'socket.io';
import { ALLOWED_ORIGINS } from './cors'




const SOCKET_CORS = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin) || process.env.SOCKETIO_CORS_ORIGIN === '*') {
            return callback(null, true);
        }
        try {
            const hostname = new URL(origin).hostname.toLowerCase();
            if (hostname === 'restpoint.co.ke' || hostname.endsWith('.restpoint.co.ke')) {
                return callback(null, true);
            }
        } catch { /* malformed Origin -> reject */ }
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        callback(null, false);
    },
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug'],
};


export { SOCKET_CORS }