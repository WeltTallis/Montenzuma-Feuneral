import express from 'express';
import { AppError, errorHandler } from './controllers/errors';
import Logger from '../../packages/shared-logger/dist/index';
import { corsOptions, ALLOWED_ORIGINS } from './utils/cors'
import { initializeRedis, redisState } from './utils/initializeRedis';
import { PORT } from './utils/getRedisURL';
import { Server as SocketIOServer } from 'socket.io';
import { SOCKET_CORS } from './utils/socketCors'
import rateLimit from 'express-rate-limit';
import { createRoutes } from './routes';
import * as jwt from 'jsonwebtoken';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';

//dotenv  configurations  
dotenv.config();

// EXPRESS APP SETUP WITH SECURITY HEADERS

const app = express();
const server = http.createServer(app);

app.use(helmet({

  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,

}));

app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: any) => req.path === '/health'
} as any);

app.use('/emit', limiter as any);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// SOCKET.IO SETUP WITH ERROR HANDLING


const io = new SocketIOServer(server, {
  cors: SOCKET_CORS,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
  serveClient: false
});


// REDIS INITIALIZE


const userRooms = new Map<string, { tenantSlug: string; userId: string; userRole: string; connectedAt: Date }>();
const socketIdMap = new Map<string, Set<string>>();
const socketTenantRooms = new Map<string, Set<string>>();
const tenantParents = new Map<string, string>();
const tenantBranches = new Map<string, Set<string>>();

function resolveOrgRooms(tenantSlug: string): string[] {
  const rooms = new Set<string>([`tenant_${tenantSlug}`]);
  const parent = tenantParents.get(tenantSlug);
  if (parent) {
    rooms.add(`tenant_${parent}`);
    tenantBranches.get(parent)?.forEach((branch) => rooms.add(`tenant_${branch}`));
  } else {
    tenantBranches.get(tenantSlug)?.forEach((branch) => rooms.add(`tenant_${branch}`));
  }
  return Array.from(rooms);
}

void initializeRedis(io, socketTenantRooms, userRooms);

io.use((socket, next) => {
  try {
    const cookieToken = socket.handshake.headers.cookie
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('access_token='))
      ?.slice('access_token='.length);
    const token = socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(' ')[1] ||
      (cookieToken ? decodeURIComponent(cookieToken) : undefined);

    if (!token) {
      // No token provided — reject in production, allow in development
      if (process.env.NODE_ENV === 'production') {
        Logger.warn({
          message: 'Socket handshake rejected: no token provided',
          origin: socket.handshake.headers.origin,
        });
        const err = new AppError('Authentication required', 401);
        err.code = 'AUTH_REQUIRED';

        Logger.warn({
          message: "   Socket  handshake   rejected    no  token   provided  ",
          error: err?.message || "   Uknown   Error "
        })


        return next(err);
      }
      // Development: allow connection without token
      socket.data.authenticated = false;
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return next(new AppError('JWT_SECRET is not configured', 500));
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      socket.data.authenticated = true;
      socket.data.user = decoded;
      socket.data.userId = decoded.userId || decoded.user_id || decoded.id;
      socket.data.tenantSlug = decoded.tenantSlug || decoded.tenant_slug;
      Logger.info({ message: 'Socket authenticated', userId: socket.data.userId, tenantSlug: socket.data.tenantSlug });
      return next();
    } catch (jwtError: any) {
      Logger.warn({ message: 'Socket handshake rejected: invalid token', error: jwtError.message });
      const err = new AppError('Invalid authentication token', 401);
      err.code = 'INVALID_TOKEN';
      return next(err);
    }
  } catch (error: any) {
    Logger.error({ message: 'Socket middleware error', error: error.message });
    if (process.env.NODE_ENV === 'production') {
      const err = new AppError('Authentication failed', 401);
      err.code = 'AUTH_FAILED';
      return next(err);
    }
    return next();
  }
});

// SOCKET.IO EVENT HANDLERS


io.on('connection', (socket) => {


  Logger.info({
    message: `     New   user  connected   to teh  sockets   &{socket.id}`,

  })

  socket.emit('connected', {
    socketId: socket.id,
    message: 'Connected to Socket.IO server',
    timestamp: new Date().toISOString()
  });

  socket.on('join-tenant', async (data: { tenantSlug?: string; userId?: string; userRole?: string; parentTenantSlug?: string }, callback?: Function) => {
    try {
      if (!data || typeof data !== 'object') {
        throw new AppError('Invalid data format', 400);
      }

      const { tenantSlug, userId, userRole, parentTenantSlug } = data;

      if (!tenantSlug) throw new AppError('Tenant slug is required', 400);
      if (!userId) throw new AppError('User ID is required', 400);
      if (!/^[a-z0-9-]+$/.test(tenantSlug)) throw new AppError('Invalid tenant slug format', 400);

      const tenantRoom = `tenant_${tenantSlug}`;

      // Resolve hierarchy persistently
      const effectiveParentSlug = parentTenantSlug || tenantParents.get(tenantSlug);
      const parentRoom = effectiveParentSlug && effectiveParentSlug !== tenantSlug && /^[a-z0-9-]+$/.test(effectiveParentSlug)
        ? `tenant_${effectiveParentSlug}`
        : null;

      const userRoom = `user_${userId}`;

      // Update socket metadata if user changed on same socket
      const existing = userRooms.get(socket.id);
      if (existing && existing.userId !== userId) {
        await socket.leave(`user_${existing.userId}`);
      }

      // Maintain user's active rooms
      if (!socketTenantRooms.has(socket.id)) {
        socketTenantRooms.set(socket.id, new Set());
      }
      const rooms = socketTenantRooms.get(socket.id)!;
      rooms.add(tenantRoom);
      if (parentRoom) rooms.add(parentRoom);

      // Register or extend branch -> parent hierarchy mapping
      if (effectiveParentSlug && effectiveParentSlug !== tenantSlug) {
        tenantParents.set(tenantSlug, effectiveParentSlug);
        if (!tenantBranches.has(effectiveParentSlug)) {
          tenantBranches.set(effectiveParentSlug, new Set());
        }
        tenantBranches.get(effectiveParentSlug)!.add(tenantSlug);
      }

      // Explicitly rejoin ALL tracked rooms on current socket connection
      for (const room of rooms) await socket.join(room);
      await socket.join(userRoom);

      userRooms.set(socket.id, {
        tenantSlug,
        userId,
        userRole: userRole || 'user',
        connectedAt: new Date()
      });

      if (!socketIdMap.has(userId)) {
        socketIdMap.set(userId, new Set());
      }
      socketIdMap.get(userId)!.add(socket.id);

      Logger.info({
        message:
          ` Socket ${socket.id} joined for user ${userId}: rooms=[${Array.from(rooms).join(', ')}]`
      })

      if (typeof callback === 'function') {
        callback({
          success: true,
          room: tenantRoom,
          parentRoom,
          userId,
          role: userRole || 'user',
          timestamp: new Date().toISOString()
        });
      }

      socket.emit('joined', {
        room: tenantRoom,
        parentRoom,
        userId,
        role: userRole || 'user',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      Logger.error({
        message: "Joined    tenat  error",
        error: error
      })

      if (typeof callback === 'function') {

        callback({
          success: false,
          error: error.message || 'Failed to join tenant room'
        });
      }

      socket.emit('error', {
        message: error.message || 'Failed to join tenant room',
        code: error instanceof AppError ? error.statusCode : 400
      });
    }
  });

  socket.on('join-deceased', async (data: { tenantSlug?: string; deceasedId?: string }, callback?: Function) => {
    try {

      const { tenantSlug, deceasedId } = data;

      if (!tenantSlug || !deceasedId) {
        throw new AppError('Tenant slug and deceased ID are required', 400);
      }

      if (!/^[a-z0-9-]+$/.test(tenantSlug)) {
        throw new AppError('Invalid tenant slug format', 400);
      }

      const deceasedRoom = `deceased_${tenantSlug}_${deceasedId}`;
      await socket.join(deceasedRoom);

      console.log(`📎 Socket ${socket.id} joined ${deceasedRoom}`);

      if (typeof callback === 'function') {
        callback({
          success: true,
          room: deceasedRoom,
          deceasedId
        });
      }

      socket.emit('joined-deceased', {
        room: deceasedRoom,
        deceasedId,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      Logger.error({
        message: "Join deceased error",
        error: error
      });
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message });
      }
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    const userData = userRooms.get(socket.id);
    if (userData) {
      const { userId } = userData;
      const sockets = socketIdMap.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          socketIdMap.delete(userId);
        }
      }
    }
    userRooms.delete(socket.id);
    socketTenantRooms.delete(socket.id);
    Logger.info({
      message: "User disconnected",
      userId: socket.id
    });
  });

  socket.on('error', (error: Error) => {
    Logger.error({
      message: "Socket error",
      error: error
    });
    socket.emit('error', {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  });
});


// REST endpoints are registered in one route module and receive only the
// runtime dependencies needed by their controllers.
app.use(createRoutes({
  io,
  logger: Logger,
      redisConnected: () => redisState.connected,
      pubClient: () => redisState.publisher,
  userRooms,
  resolveOrgRooms,
}));

// Global 404 & Error Handler
app.use((req, res) => {
  Logger.info({
    message: `[404] ${req.method} ${req.path}`
  });
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

// Graceful Shutdown
let shuttingDown = false;

const gracefulShutdown = async (signal: string, exitCode = 0): Promise<void> => {
  if (shuttingDown) return;
  shuttingDown = true;
  Logger.info({
    message: `Received ${signal}, starting graceful shutdown...`
  });

  const forceExit = setTimeout(() => {
    Logger.error({
      message: 'Graceful shutdown timeout, forcing exit...'
    });
    process.exit(1);
  }, 10000);

  try {
    if (redisState.retryTimer) {
      clearTimeout(redisState.retryTimer);
      redisState.retryTimer = null;
    }

    await new Promise<void>((resolve, reject) => {
      io.close((error?: Error) => error ? reject(error) : resolve());
    });

    for (const client of [redisState.publisher, redisState.subscriber]) {
      if (client?.isOpen) await client.quit();
    }

    clearTimeout(forceExit);
    process.exit(exitCode);
  } catch (error: any) {
    clearTimeout(forceExit);
    Logger.error({
      message: 'Graceful shutdown failed',
      error: error
    });
    process.exit(1);
  }
};

process.on('SIGTERM', () => { void gracefulShutdown('SIGTERM'); });
process.on('SIGINT', () => { void gracefulShutdown('SIGINT'); });


process.on('uncaughtException', (error: Error) => {
  Logger.error({
    message: 'Uncaught Exception',
    error: error
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  Logger.error({
    message: 'Unhandled Rejection',
    error: reason
  });
  void gracefulShutdown('Unhandled rejection', 1);
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  Logger.info({
    message: `Socket.IO Server running on port ${PORT}`
  });
  Logger.info({
    message: `Redis: ${redisState.connected ? 'Connected' : 'Fallback mode'}`
  });
  Logger.info({
    message: `Origins: ${ALLOWED_ORIGINS.join(', ')}`
  });
  Logger.info({
    message: `Security: Helmet + CORS + Rate Limiting enabled`
  });
  Logger.info({
    message: `Environment: ${process.env.NODE_ENV || 'development'}`
  });
  Logger.info({
    message: `Health: http://localhost:${PORT}/health`
  });
});
