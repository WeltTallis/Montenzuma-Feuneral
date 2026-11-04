import { autoInitSystemAdmin } from './scripts/auto-init-system-admin';
import express, { Request, Response, NextFunction } from 'express';
import Logger from '../../packages/shared-logger/dist/index';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import type { Server } from 'http';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import hpp from 'hpp';
import cors from 'cors';

// Load environment variables from the repo-root .env before any env value is
// read below. (Imports are hoisted, so this still runs after every import.)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.PORT || 5001;
const app = express();

// HTTP server handle — captured in startServer() and used by gracefulShutdown().
let server: Server | null = null;

app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));


// 1c. HPP - prevent HTTP parameter pollution
app.use(hpp({
  whitelist: ['page', 'limit', 'status', 'search'],
}));
// 1d. Body parsing with limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(process.env.JWT_SECRET));

// 1b. CORS - strict in production
const corsOptions: cors.CorsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 'Authorization', 'X-Requested-With',
    'Accept', 'Origin', 'X-Tenant-Id', 'X-CSRF-Token',
    'x-tenant-slug', 'x-branch-id', 'x-auth-cookie'
  ],
  exposedHeaders: ['Set-Cookie', 'X-CSRF-Token'],
  maxAge: 86400, // 24h preflight cache
};
app.use(cors(corsOptions));



// 1e. Session - remember user across requests
const SESSION_SECRET = process.env.JWT_SECRET || '';
app.set('trust proxy', 1); // trust first proxy (nginx/gateway)

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'restpoint.sid',
  cookie: {
    httpOnly: true,       // not accessible via JS
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',   // CSRF protection via SameSite
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  },
  rolling: true, // refresh session on each request
}));

// 1f. Rate limiting - global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
});
app.use('/auth', globalLimiter);

// 2. REQUEST LOGGING


if (process.env.LOG_LEVEL !== 'silent') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.url} ` +
      `IP:${req.ip} Session:${req.session?.id?.slice(0, 8) || 'none'}`
    );
    next();
  });
}


// 3. HEALTH CHECK


app.get('/health', (_req: Request, res: Response) => {

  res.json({
    status: 'OK',
    service: 'auth-service',
    version: '2.0.0-ts',
    timestamp: new Date().toISOString(),
  });

});


// 4. AUTH ROUTES


app.use('/auth', authRoutes);


// 5. CSRF TOKEN ENDPOINT


app.get('/auth/csrf-token', (req: Request, res: Response) => {
  // Generate and return a CSRF token stored in session
  const token = req.sessionID + '-' + Date.now();
  (req.session as any).csrfToken = token;
  res.json({ success: true, csrfToken: token });
});


// 6. ERROR HANDLING


// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found in auth-service`,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  // Handle aborted requests gracefully
  if (err.type === 'request.aborted' || (err.message && err.message.includes('aborted'))) {
    console.warn(`[Warning] Request to ${req.url} was aborted.`);
    if (!res.headersSent) {
      return res.status(400).json({
        success: false,
        message: 'Request aborted or connection closed unexpectedly.',
      });
    }
    return;
  }

  // Handle CSRF errors
  if (err.code === 'EBADCSRFTOKEN' || err.message?.includes('csrf')) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token. Please refresh and try again.',
    });
  }


  res.status(500).json({
    success: false,
    message: 'Something went wrong inside auth-service!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});


// 7. STARTUP SEQUENCE


async function startServer() {
  const { spawn } = require('child_process');

  async function runBootstrapIfAdminAvailable(): Promise<boolean> {
    const adminUser = process.env.DB_ADMIN_USER || process.env.ROOT_DB_USER;
    const adminPass = process.env.DB_ADMIN_PASSWORD || process.env.ROOT_DB_PASSWORD;
    if (!adminUser || !adminPass) {

      return false;
    }

    return new Promise((resolve, reject) => {
      const env = Object.assign({}, process.env, {
        DB_ADMIN_USER: adminUser,
        DB_ADMIN_PASSWORD: adminPass,
      });

      const child = spawn(process.execPath, ['scripts/bootstrap-db.js'], {
        env, cwd: __dirname, stdio: ['ignore', 'pipe', 'pipe'],
      });

      child.stdout.on('data', (data: Buffer) => console.log(`[bootstrap] ${data.toString().trim()}`));
      child.stderr.on('data', (data: Buffer) => console.error(`[bootstrap] ${data.toString().trim()}`));
      child.on('error', (err: Error) => reject(err));
      child.on('close', (code: number | null) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error('Bootstrap script failed with exit code ' + code));
        }
      });
    });
  }

  try {
    let initResult: any;
    try {
      initResult = await autoInitSystemAdmin();
      if (!initResult.success) {
        const isAccessDenied = initResult.message && initResult.message.toLowerCase().includes('access denied');
        if (isAccessDenied) {
          await runBootstrapIfAdminAvailable();
          initResult = await autoInitSystemAdmin();
        }
      } else {
        console.log(' System admin auto-initialization complete');
      }
    } catch (err: any) {
      const isAccessDenied = err?.code === 'ER_ACCESS_DENIED_ERROR' ||
        (err?.message && err.message.toLowerCase().includes('access denied'));
      if (isAccessDenied) {
        console.warn('DB access denied. Attempting bootstrap...');
        await runBootstrapIfAdminAvailable();
        const retryResult = await autoInitSystemAdmin();
        if (!retryResult.success) {
          process.exit(1);
        }
      } else {
        console.error('❌ Auto-init error:', err?.message || err);
        process.exit(1);
      }
    }
  } catch (error: any) {
    process.exit(1);
  }

  const HOST = process.env.HOST || '0.0.0.0';
  server = app.listen(Number(PORT), HOST, () => {
    console.log(`[auth-service] Listening on http://${HOST}:${PORT} (PID ${process.pid})`);
  });
}

startServer();



const gracefulShutdown = (signal: string) => {
  console.log(`[SHUTDOWN] auth-service received ${signal}. Closing HTTP server...`);
  if (!server) {
    process.exit(0);
  }
  server.close(() => {
    console.log('[SHUTDOWN] HTTP server closed. Exiting.');
    process.exit(0);
  });
  // Safety net: force-exit if keep-alive connections refuse to drain.
  setTimeout(() => {
    console.error('[SHUTDOWN] Graceful shutdown timed out — forcing exit.');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  Logger.error({
    message: 'Unhandled Rejection in auth-service',
    error: reason,
  });
});

process.on('uncaughtException', (err) => {
  Logger.error({
    message: 'Uncaught Exception in auth-service',
    error: err,
  });
});


// Export for testing
export default app;