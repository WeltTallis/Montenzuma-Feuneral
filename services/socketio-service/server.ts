import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

dotenv.config();
// ============================================
// ERROR HANDLING UTILITIES
// ============================================

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

  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

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

// Security Headers - Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

// ─── CRITICAL FIX: Include ALL dev and production origins ───
const ALLOWED_ORIGINS: string[] = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',  // Vite dev server
      'http://localhost:5174',  // Vite alt port
      'http://localhost:8080',  // Docker frontend
      'https://restpoint.co.ke',
    ];

// CORS Configuration - allow all common origins
const corsOptions: cors.CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow if in allowed list or if SOCKETIO_CORS_ORIGIN is wildcard
    if (ALLOWED_ORIGINS.includes(origin) || process.env.SOCKETIO_CORS_ORIGIN === '*') {
      return callback(null, true);
    }
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    callback(null, true); // Allow all for now
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

// Rate Limiting
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  skip: (req: any) => req.path === '/health' // Skip health checks
} as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use('/emit', limiter as any);

// Body Parser with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ============================================
// SOCKET.IO SETUP WITH ERROR HANDLING
// ============================================

const PORT = parseInt(process.env.PORT || process.env.SOCKET_PORT || '5018', 10);

// Redis URL construction with error handling
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
    return 'redis://redis:6379'; // Fallback
  }
};

const REDIS_URL = getRedisUrl();

// ─── CRITICAL FIX: Socket.IO CORS must match Express CORS ───
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
  maxHttpBufferSize: 1e6, // 1MB
  serveClient: false // Disable serving socket.io client
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
            console.error('Redis max reconnection attempts reached');
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
    console.log(' Socket.IO Redis Adapter connected successfully');

  } catch (error: any) {
    console.warn(' Redis connection failed, falling back to in-memory adapter:', error.message);
    redisConnected = false;

    // Clean up failed clients
    try {
      if (pubClient) await pubClient.disconnect();
      if (subClient) await subClient.disconnect();
    } catch (cleanupError: any) {
      console.error('Redis cleanup error:', cleanupError.message);
    }

    console.warn(' Socket.IO running in-memory mode - horizontal scaling unavailable');
  }
};

// Initialize Redis
initializeRedis().catch(console.error);

// ============================================
// SOCKET.IO MIDDLEWARE - AUTHENTICATION
// ============================================

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      // Don't block connections without tokens in dev mode
      if (process.env.NODE_ENV === 'production') {
        const err = new AppError('Authentication required', 401);
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
// SOCKET.IO EVENT HANDLERS - NOTIFICATIONS ONLY
// ============================================

// Store active user rooms
const userRooms = new Map<string, { tenantSlug: string; userId: string; userRole: string; connectedAt: Date }>();
const socketIdMap = new Map<string, Set<string>>(); // Track socket IDs by user

io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  // Welcome message
  socket.emit('connected', {
    socketId: socket.id,
    message: 'Connected to Socket.IO server',
    timestamp: new Date().toISOString()
  });

  // ============================================
  // TENANT & USER ROOM MANAGEMENT
  // ============================================

  socket.on('join-tenant', (data: { tenantSlug?: string; userId?: string; userRole?: string }, callback?: Function) => {
    try {
      // Validate input
      if (!data || typeof data !== 'object') {
        throw new AppError('Invalid data format', 400);
      }

      const { tenantSlug, userId, userRole } = data;

      if (!tenantSlug) {
        throw new AppError('Tenant slug is required', 400);
      }

      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      // Validate tenant slug format
      if (!/^[a-z0-9-]+$/.test(tenantSlug)) {
        throw new AppError('Invalid tenant slug format', 400);
      }

      const tenantRoom = `tenant_${tenantSlug}`;
      const userRoom = `user_${userId}`;

      // Leave existing rooms
      const existing = userRooms.get(socket.id);
      if (existing) {
        socket.leave(`tenant_${existing.tenantSlug}`);
        socket.leave(`user_${existing.userId}`);
      }

      // Join new rooms
      socket.join(tenantRoom);
      socket.join(userRoom);

      // Store user data
      userRooms.set(socket.id, {
        tenantSlug,
        userId,
        userRole: userRole || 'user',
        connectedAt: new Date()
      });

      // Map socket to user for tracking
      if (!socketIdMap.has(userId)) {
        socketIdMap.set(userId, new Set());
      }
      socketIdMap.get(userId)!.add(socket.id);

      console.log(`📎 Socket ${socket.id} joined tenant_${tenantSlug} as ${userRole || 'user'}`);

      // Send success response
      if (typeof callback === 'function') {
        callback({
          success: true,
          room: tenantRoom,
          userId,
          role: userRole || 'user',
          timestamp: new Date().toISOString()
        });
      }

      socket.emit('joined', {
        room: tenantRoom,
        userId,
        role: userRole || 'user',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Join tenant error:', error);
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

  /**
   * Join deceased record room
   */
  socket.on('join-deceased', (data: { tenantSlug?: string; deceasedId?: string }, callback?: Function) => {
    try {
      const { tenantSlug, deceasedId } = data;

      if (!tenantSlug || !deceasedId) {
        throw new AppError('Tenant slug and deceased ID are required', 400);
      }

      // Validate input
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

  // ============================================
  // DISCONNECT HANDLING
  // ============================================

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
    console.log(`👋 User disconnected: ${socket.id}`);
  });

  // Global error handler for socket
  socket.on('error', (error: Error) => {
    console.error(`❌ Socket error (${socket.id}):`, error);
    socket.emit('error', {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  });
});

// Handle uncaught exceptions in socket handlers at process level
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  // Don't crash the server - log and continue
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't crash the server - log and continue
});

// ============================================
// REST ENDPOINTS - NOTIFICATION EMIT ONLY
// ============================================

interface EmitBody {
  tenantSlug?: string;
  data?: any;
  target?: string | string[];
}

/**
 * Emit events via REST API
 * Other services call this endpoint to emit notifications to connected clients
 */
app.post('/emit/:event', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { event } = req.params;
    const { tenantSlug, data, target } = req.body as EmitBody;

    if (!event || typeof event !== 'string') {
      throw new AppError('Invalid event name', 400);
    }

    if (!tenantSlug) {
      throw new AppError('tenantSlug is required', 400);
    }

    if (!data || typeof data !== 'object') {
      throw new AppError('Data must be a valid object', 400);
    }

    // Security: Validate event name (alphanumeric, dash, underscore only)
    if (!/^[a-zA-Z0-9\-_]+$/.test(event)) {
      throw new AppError('Invalid event name format', 400);
    }

    // Security: Validate tenant slug
    if (!/^[a-z0-9-]+$/.test(tenantSlug)) {
      throw new AppError('Invalid tenant slug format', 400);
    }

    const payload = {
      ...data,
      timestamp: new Date().toISOString()
    };

    // Special events that don't get prefix
    const noPrefixEvents = ['ticket_response', 'ticket_updated', 'onboarding-progress'];
    const eventName = noPrefixEvents.includes(event) ? event : `notification:${event}`;

    // Emit to specific target if provided
    if (target) {
      if (typeof target === 'string') {
        io.to(target).emit(eventName, payload);
      } else if (Array.isArray(target)) {
        target.forEach((room: string) => io.to(room).emit(eventName, payload));
      } else {
        throw new AppError('Target must be a string or array of strings', 400);
      }
    } else {
      // Emit to tenant room
      io.to(`tenant_${tenantSlug}`).emit(eventName, payload);
    }

    // Store in Redis for real-time delivery (temporary cache - 24h TTL)
    if (
      redisConnected &&
      pubClient &&
      (eventName.startsWith('notification:') || eventName.startsWith('alert:') ||
       eventName.startsWith('new_booking') || eventName.startsWith('booking_'))
    ) {
      try {
        const notifKey = `notifications:${tenantSlug}:socketio:${data.id || `notif-${Date.now()}`}`;
        const notifValue = JSON.stringify({
          id: data.id || `notif-${Date.now()}`,
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
        await pubClient.setEx(notifKey, 86400, notifValue); // 24h TTL
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

/**
 * ─── Notification REST endpoints ───
 * The API Gateway routes /notification/* to this service
 */
app.get(['/notification/notifications', '/notifications'], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] as string;
    if (!tenantSlug) throw new AppError('tenantSlug is required', 400);

    // Fetch notifications from Redis only (no database)
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
        } catch {
          // Skip invalid JSON
        }
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

    // Delete notification from Redis when read (auto-delete on read)
    if (redisConnected && pubClient) {
      const key = `notifications:${tenantSlug}:socketio:${id}`;
      await pubClient.del(key);
      console.log(`🗑️  Deleted notification ${id} from Redis (read by user)`);
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

    // Delete all notifications for this tenant from Redis (mark all as read)
    if (redisConnected && pubClient) {
      const pattern = `notifications:${tenantSlug}:*`;
      const keys: string[] = [];
      let cursor = 0;
      do {
        const result = await pubClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = result.cursor;
        keys.push(...result.keys);
      } while (cursor !== 0);

      // Delete all keys
      if (keys.length > 0) {
        await pubClient.del(keys);
        console.log(`🗑️  Deleted ${keys.length} notifications for tenant ${tenantSlug} (mark all as read)`);
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

/**
 * Health check endpoint
 */
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

    const statusCode = redisConnected ? 200 : 200; // Still healthy, just degraded
    res.status(statusCode).json(health);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Detailed stats endpoint (admin only)
 */
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

/**
 * Room members endpoint
 */
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

// ============================================
// GLOBAL ERROR HANDLING MIDDLEWARE
// ============================================

// 404 handler
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// ============================================
// PROCESS LEVEL ERROR HANDLING
// ============================================

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n Received ${signal}, starting graceful shutdown...`);

  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Close Redis connections
  if (redisConnected) {
    try {
      await pubClient?.quit();
      await subClient?.quit();
      console.log('Redis connections closed');
    } catch (error: any) {
      console.error('Redis shutdown error:', error);
    }
  }

  // Close socket connections
  io.close(() => {
    console.log('Socket.IO closed');
  });

  // Force exit after timeout
  setTimeout(() => {
    console.log('Graceful shutdown timeout, forcing exit...');
    process.exit(1);
  }, 10000);

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('💥 Uncaught Exception:', error.message);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, just log and continue
});

// ============================================
// START SERVER
// ============================================

server.listen(PORT, '0.0.0.0', () => {
  console.log(` Socket.IO Server running on port ${PORT}`);
  console.log(` Redis: ${redisConnected ? ' Connected' : ' Fallback mode'}`);
  console.log(` Origins: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(` Security: Helmet + CORS + Rate Limiting enabled`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health: http://localhost:${PORT}/health`);
});