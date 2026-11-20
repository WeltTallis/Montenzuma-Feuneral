import Logger from '../../../packages/shared-logger/dist/index';
import cors from 'cors'

const ALLOWED_ORIGINS: string[] = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : [
        'http://localhost:5173',
        'http://localhost:8080',
        'https://restpoint.co.ke',
    ];

const corsOptions: cors.CorsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }

        try {
            const hostname = new URL(origin).hostname.toLowerCase();
            if (hostname === 'restpoint.co.ke' || hostname.endsWith('.restpoint.co.ke')) {
                return callback(null, true);
            }
        } catch (e) { /* malformed Origin  fall through */ }
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        Logger.warn({
            message: "   Origin    not  allowed    by  SOCKET.IO    CORS   Policy",
            origin: origin,
            allowedOrigins: ALLOWED_ORIGINS
        })

        callback(new Error('Origin is not allowed by Socket.IO CORS policy'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'x-tenant-slug',
        'x-tenant-id',
        'x-user-id',
        'x-branch-slug',
        'x-branch-id',
    ]
};



export { corsOptions, ALLOWED_ORIGINS }