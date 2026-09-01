import express, { Request, Response, NextFunction } from 'express';
import { createAdapter } from '@socket.io/redis-adapter';
import Logger from '../../packages/shared-logger/dist/index';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import { error } from 'console';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';

dotenv.config();

// ERROR HANDLING UTILITIES

class AppError extends Error {
  public statusCode: number;
  public details: any;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

interface ErrorResponse {
  success: boolean;
  message: string;
  details?: any;
  stack?: string;
}

const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;

  const response: ErrorResponse = {
    success: false,
    message: isOperational ? err.message : 'Internal server error',
    ...(err instanceof AppError && err.details ? { details: err.details } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  };

  res.status(statusCode).json(response);
};

// ============================================
// EXPRESS APP SETUP WITH SECURITY HEADERS
// ============================================

const app = express();
const server = http.createServer(app);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

const ALLOWED_ORIGINS: string[] = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  : [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8080',
    'https://restpoint.co.ke',
  ];

const corsOptions: cors.CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || process.env.SOCKETIO_CORS_ORIGIN === '*') {
      return callback(null, true);
    }
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    callback(null, true);
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

// ============================================
// SOCKET.IO SETUP WITH ERROR HANDLING
// ============================================

const PORT = parseInt(process.env.PORT || process.env.SOCKET_PORT || '5018', 10);

const getRedisUrl = (): string => {
  try {
    if (process.env.REDIS_URL) {
      return process.env.REDIS_URL;
    }
    if (process.env.REDIS_HOST) {
      const password = process.env.REDIS_PASSWORD
        ? `:${encodeURIComponent(process.env.REDIS_PASSWORD)}@`
        : '';
      const port = process.env.REDIS_PORT || 6379;
      return `redis://${password}${process.env.REDIS_HOST}:${port}`;
    }
    return 'redis://redis:6379';
  } catch (error) {
    console.error('Redis URL construction error:', error);
    return 'redis://redis:6379';
  }
};

const REDIS_URL = getRedisUrl();

const SOCKET_CORS = {
  origin: process.env.NODE_ENV === 'production'
    ? ALLOWED_ORIGINS
    : '*',
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug'],
};

const io = new SocketIOServer(server, {
  cors: SOCKET_CORS,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
  serveClient: false
});

// ============================================
// REDIS ADAPTER WITH GRACEFUL FALLBACK
// ============================================

let redisConnected = false;
let pubClient: ReturnType<typeof createClient> | null = null;
let subClient: ReturnType<typeof createClient> | null = null;

const initializeRedis = async (): Promise<void> => {
  try {
    pubClient = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            Logger.error({
              message:   'Redis    max    reconection attempts  reached',
              error:     error
            })
          
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        },
        timeout: 10000
      }
    });

    subClient = pubClient.duplicate();

    pubClient.on('error', (err: Error) => {
      console.error('Redis Pub Client Error:', err.message);
      redisConnected = false;
    });

    subClient.on('error', (err: Error) => {
      console.error('Redis Sub Client Error:', err.message);
      redisConnected = false;
    });

    pubClient.on('connect', () => {
      console.log('Redis Pub Client connected');
    });

    subClient.on('connect', () => {
      console.log('Redis Sub Client connected');
    });

    await Promise.all([
      pubClient.connect(),
      subClient.connect()
    ]);

    redisConnected = true;
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Socket.IO Redis Adapter connected successfully');

  } catch (error: any) {
    console.warn('Redis connection failed, falling back to in-memory adapter:', error.message);
    redisConnected = false;

    try {
      if (pubClient) await pubClient.disconnect();
      if (subClient) await subClient.disconnect();
    } catch (cleanupError: any) {


      Logger.error({
        message:    ' Redis   clen up    error   detected ',
        error:   error
      })

    }
    Logger.warn({
     message:          'Socket.IO running in-memory mode - horizontal scaling unavailable',
     
     
    })
  }
};

initializeRedis().catch(console.error);

// ============================================
// SOCKET.IO MIDDLEWARE - AUTHENTICATION
// ============================================

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      if (process.env.NODE_ENV === 'production') {
        const err = new AppError('Authentication required', 401);

        Logger.error({
          message:   'Authentication Required ',
          error:   err
        })
        return next(err);
      }
    }

    socket.data.authenticated = true;
    next();
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      next(new AppError('Invalid authentication token', 401));
    } else {
      next();
    }
  }
});

// ============================================
// STATE & ORG REGISTRY TRACKING
// ============================================

const userRooms = new Map<string, { tenantSlug: string; userId: string; userRole: string; connectedAt: Date }>();
const socketIdMap = new Map<string, Set<string>>();
const socketTenantRooms = new Map<string, Set<string>>();

const tenantParents = new Map<string, string>();      // branchSlug -> parentSlug
const tenantBranches = new Map<string, Set<string>>(); // parentSlug -> Set<branchSlug>

function resolveOrgRooms(tenantSlug: string): string[] {
  const rooms = new Set<string>([`tenant_${tenantSlug}`]);
  const parent = tenantParents.get(tenantSlug);

  if (parent) {
    rooms.add(`tenant_${parent}`);
    const siblings = tenantBranches.get(parent);
    if (siblings) siblings.forEach((b) => rooms.add(`tenant_${b}`));
  } else {
    const branches = tenantBranches.get(tenantSlug);
    if (branches) branches.forEach((b) => rooms.add(`tenant_${b}`));
  }
  return Array.from(rooms);
}

// ============================================
// SOCKET.IO EVENT HANDLERS
// ============================================

io.on('connection', (socket) => {
 

  Logger.info({
    message:    `   👤   New   user  connected   to teh  sockets   &{socket.id}`,

  })

  socket.emit('connected', {
    socketId: socket.id,
    message: 'Connected to Socket.IO server',
    timestamp: new Date().toISOString()
  });

  socket.on('join-tenant', (data: { tenantSlug?: string; userId?: string; userRole?: string; parentTenantSlug?: string }, callback?: Function) => {
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
        socket.leave(`user_${existing.userId}`);
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
      rooms.forEach((r) => socket.join(r));
      socket.join(userRoom);

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
      ` 📎 Socket ${socket.id} joined for user ${userId}: rooms=[${Array.from(rooms).join(', ')}]`
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
      console.error('Join tenant error:', error);
      Logger.error({
        message:    "Joined    tenat  error",
        error:   error
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

  socket.on('join-deceased', (data: { tenantSlug?: string; deceasedId?: string }, callback?: Function) => {
    try {
      const { tenantSlug, deceasedId } = data;

      if (!tenantSlug || !deceasedId) {
        throw new AppError('Tenant slug and deceased ID are required', 400);
      }

      if (!/^[a-z0-9-]+$/.test(tenantSlug)) {
        throw new AppError('Invalid tenant slug format', 400);
      }

      const deceasedRoom = `deceased_${tenantSlug}_${deceasedId}`;
      socket.join(deceasedRoom);

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
      console.error('Join deceased error:', error);
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
    console.log(`👋 User disconnected: ${socket.id}`);
  });

  socket.on('error', (error: Error) => {
    console.error(`❌ Socket error (${socket.id}):`, error);
    socket.emit('error', {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  });
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// ============================================
// REST ENDPOINTS - NOTIFICATION EMIT
// ============================================

interface EmitBody {
  tenantSlug?: string;
  data?: any;
  target?: string | string[];
  branchSlugs?: string[];
}

app.post('/emit/:event', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { event } = req.params;
    const { tenantSlug, data, target, branchSlugs } = req.body as EmitBody;

    if (!event || typeof event !== 'string') throw new AppError('Invalid event name', 400);
    if (!tenantSlug) throw new AppError('tenantSlug is required', 400);
    if (!data || typeof data !== 'object') throw new AppError('Data must be a valid object', 400);
    if (!/^[a-zA-Z0-9\-_]+$/.test(event)) throw new AppError('Invalid event name format', 400);
    if (!/^[a-z0-9-]+$/.test(tenantSlug)) throw new AppError('Invalid tenant slug format', 400);

    const payload = {
      ...data,
      timestamp: new Date().toISOString()
    };

    const noPrefixEvents = ['ticket_response', 'ticket_updated', 'onboarding-progress'];
    const eventName = noPrefixEvents.includes(event) ? event : `notification:${event}`;

    if (target) {
      if (typeof target === 'string') {
        io.to(target).emit(eventName, payload);
      } else if (Array.isArray(target)) {
        target.forEach((room: string) => io.to(room).emit(eventName, payload));
      } else {
        throw new AppError('Target must be a string or array of strings', 400);
      }
    } else if (Array.isArray(branchSlugs) && branchSlugs.length > 0) {
      // Branch-targeted emission: deliver ONLY to the specified branch rooms
      // (complete branch slugs, e.g. org-home-machakos). Skips the org-wide
      // fan-out so other branches NEVER see this notification.
      const branchRooms = branchSlugs
        .filter((s: any): s is string => typeof s === 'string' && /^[a-z0-9-]+$/.test(s))
        .map((s: string) => `tenant_${s}`);
      if (branchRooms.length === 0) throw new AppError('No valid branch slugs provided', 400);
      branchRooms.forEach((room) => io.to(room).emit(eventName, payload));
      console.log(`[SocketIO] Emitted ${eventName} to branch rooms [${branchRooms.join(', ')}]`);
    } else if (tenantSlug === 'system' || tenantSlug === 'all') {
      io.emit(eventName, payload);
      console.log(`📢 Broadcasted ${eventName} to all clients`);
    } else {
      const rooms = resolveOrgRooms(tenantSlug);
      rooms.forEach((room) => io.to(room).emit(eventName, payload));
      console.log(`[SocketIO] Emitted ${eventName} to [${rooms.join(', ')}]`);
    }

    if (
      redisConnected &&
      pubClient &&
      (eventName.startsWith('notification:') || eventName.startsWith('alert:') ||
        eventName.startsWith('new_booking') || eventName.startsWith('booking_'))
    ) {
      try {
        const notifId = data.id || `notif-${Date.now()}`;
        const notifValue = JSON.stringify({
          id: notifId,
          title: data.title || eventName,
          message: data.message || `New event: ${eventName}`,
          type: data.type || 'info',
          priority: data.priority || 'low',
          fullContent: data.fullContent || data.details || data.message || '',
          data: data,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          read: false,
          delivered: false,
        });

        if (tenantSlug === 'system' || tenantSlug === 'all') {
          const allTenants = new Set<string>([
            'restpoint',
            'default',
            'main',
            'system',
            'system_shared'
          ]);

          userRooms.forEach((userData) => {
            allTenants.add(userData.tenantSlug);
          });

          const storePromises = Array.from(allTenants).map(tenant => {
            const key = `notifications:${tenant}:socketio:${notifId}`;
            return pubClient.setEx(key, 86400, notifValue);
          });

          await Promise.all(storePromises);
          console.log(`💾 Stored system notification under ${allTenants.size} tenants: ${Array.from(allTenants).join(', ')}`);
        } else {
          const notifKey = `notifications:${tenantSlug}:socketio:${notifId}`;
          await pubClient.setEx(notifKey, 86400, notifValue);
        }
      } catch (err: any) {
        console.error('Failed to store notification in Redis:', err);
      }
    }

    console.log(`📨 Emitted ${eventName} to tenant_${tenantSlug}`);

    res.json({
      success: true,
      event: eventName,
      tenantSlug,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
});

// REST API Notifications Management
app.get(['/notification/notifications', '/notifications'], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] as string;
    if (!tenantSlug) throw new AppError('tenantSlug is required', 400);

    if (!redisConnected || !pubClient) {
      res.json({ notifications: [], total: 0 });
      return;
    }

    const pattern = `notifications:${tenantSlug}:*`;
    const keys: string[] = [];
    let cursor = 0;
    do {
      const result = await pubClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = result.cursor;
      keys.push(...result.keys);
    } while (cursor !== 0);

    const notifications: any[] = [];
    for (const key of keys) {
      const value = await pubClient.get(key);
      if (value) {
        try {
          notifications.push(JSON.parse(value));
        } catch { }
      }
    }

    res.json({ notifications, total: notifications.length });
  } catch (error) {
    next(error);
  }
});

app.put(['/notification/notifications/:id/read', '/notifications/:id/read'], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] as string;
    const { id } = req.params;
    if (!tenantSlug) throw new AppError('tenantSlug is required', 400);

    if (redisConnected && pubClient) {
      const key = `notifications:${tenantSlug}:socketio:${id}`;
      await pubClient.del(key);
      console.log(`🗑️ Deleted notification ${id} from Redis (read by user)`);
    }

    res.json({ success: true, message: 'Notification marked as read and deleted' });
  } catch (error) {
    next(error);
  }
});

app.put(['/notification/notifications/mark-all-read', '/notifications/mark-all-read'], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] as string;
    if (!tenantSlug) throw new AppError('tenantSlug is required', 400);

    if (redisConnected && pubClient) {
      const pattern = `notifications:${tenantSlug}:*`;
      const keys: string[] = [];
      let cursor = 0;
      do {
        const result = await pubClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = result.cursor;
        keys.push(...result.keys);
      } while (cursor !== 0);

      if (keys.length > 0) {
        await pubClient.del(keys);
        console.log(`🗑️ Deleted ${keys.length} notifications for tenant ${tenantSlug}`);
      }
    }

    res.json({ success: true, message: 'All notifications marked as read and deleted' });
  } catch (error) {
    next(error);
  }
});

app.delete(['/notification/notifications/:id', '/notifications/:id'], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] as string;
    const { id } = req.params;
    if (!tenantSlug) throw new AppError('tenantSlug is required', 400);

    if (redisConnected && pubClient) {
      const key = `notifications:${tenantSlug}:socketio:${id}`;
      await pubClient.del(key);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get('/health', (req: Request, res: Response) => {
  try {
    const health = {
      status: 'UP',
      service: 'socketio-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      connections: {
        active: typeof io.engine.clientsCount === 'number' ? io.engine.clientsCount : 0,
        userRooms: userRooms.size,
        socketIdMap: socketIdMap.size
      },
      redis: {
        connected: redisConnected
      },
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(health);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/stats', (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = {
      activeConnections: Number(io.engine.clientsCount) || 0,
      userRooms: userRooms.size,
      socketIdMap: socketIdMap.size,
      redisConnected,
      rooms: Array.from(io.sockets.adapter.rooms.keys()).filter((r: string) => r.startsWith('tenant_')),
      timestamp: new Date().toISOString()
    };

    res.json(stats);

  } catch (error) {
    next(error);
  }
});

app.get('/rooms/:room/members', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { room } = req.params;

    if (!room || typeof room !== 'string') {
      throw new AppError('Invalid room name', 400);
    }

    const roomData = io.sockets.adapter.rooms.get(room);

    res.json({
      room,
      members: roomData ? Array.from(roomData) : [],
      count: roomData ? roomData.size : 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
});

// Global 404 & Error Handler
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n Received ${signal}, starting graceful shutdown...`);

  server.close(() => {
    console.log('HTTP server closed');
  });

  if (redisConnected) {
    try {
      await pubClient?.quit();
      await subClient?.quit();
      console.log('Redis connections closed');
    } catch (error: any) {
      console.error('Redis shutdown error:', error);
    }
  }

  io.close(() => {
    console.log('Socket.IO closed');
  });

  setTimeout(() => {
    console.log('Graceful shutdown timeout, forcing exit...');
    process.exit(1);
  }, 10000);

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error: Error) => {
  console.error('💥 Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Socket.IO Server running on port ${PORT}`);
  console.log(`Redis: ${redisConnected ? 'Connected' : 'Fallback mode'}`);
  console.log(`Origins: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`Security: Helmet + CORS + Rate Limiting enabled`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});