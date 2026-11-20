import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server as SocketIOServer } from 'socket.io';
import Logger from '../../../packages/shared-logger/dist/index';
import { REDIS_URL } from './getRedisURL';

type RedisClient = ReturnType<typeof createClient>;
type UserRooms = ReadonlyMap<string, { userId: string }>;

export const redisState: {
  connected: boolean;
  publisherReady: boolean;
  subscriberReady: boolean;
  publisher: RedisClient | null;
  subscriber: RedisClient | null;
  retryTimer: ReturnType<typeof setTimeout> | null;
} = {
  connected: false,
  publisherReady: false,
  subscriberReady: false,
  publisher: null,
  subscriber: null,
  retryTimer: null,
};

const refreshReadiness = (): void => {
  redisState.connected = redisState.publisherReady && redisState.subscriberReady;
};

export const initializeRedis = async (
  io: SocketIOServer,
  socketTenantRooms: ReadonlyMap<string, ReadonlySet<string>>,
  userRooms: UserRooms,
): Promise<void> => {
  try {
    const publisher = createClient({
      url: REDIS_URL,
      socket: { reconnectStrategy: (retries: number) => Math.min(retries * 200, 5000), timeout: 10000 },
    });
    const subscriber = publisher.duplicate();
    redisState.publisher = publisher;
    redisState.subscriber = subscriber;

    publisher.on('error', (error) => { redisState.publisherReady = false; refreshReadiness(); Logger.warn({ message: 'Redis publisher error', error }); });
    subscriber.on('error', (error) => { redisState.subscriberReady = false; refreshReadiness(); Logger.warn({ message: 'Redis subscriber error', error }); });
    publisher.on('ready', () => { redisState.publisherReady = true; refreshReadiness(); });
    subscriber.on('ready', () => { redisState.subscriberReady = true; refreshReadiness(); });

    await Promise.all([publisher.connect(), subscriber.connect()]);
    redisState.publisherReady = publisher.isReady;
    redisState.subscriberReady = subscriber.isReady;
    refreshReadiness();
    if (!redisState.connected) throw new Error('Redis publisher and subscriber are not ready');

    io.adapter(createAdapter(publisher, subscriber));
    if (redisState.retryTimer) { clearTimeout(redisState.retryTimer); redisState.retryTimer = null; }
    for (const socket of io.sockets.sockets.values()) {
      for (const room of socketTenantRooms.get(socket.id) || []) await socket.join(room);
      const user = userRooms.get(socket.id);
      if (user) await socket.join(`user_${user.userId}`);
    }
    Logger.info({ message: 'Socket.IO Redis adapter connected successfully' });
  } catch (error: any) {
    redisState.publisherReady = false;
    redisState.subscriberReady = false;
    redisState.connected = false;
    Logger.warn({ message: 'Redis unavailable; Socket.IO is using in-memory mode', error: error?.message || error });
    for (const client of [redisState.publisher, redisState.subscriber]) {
      try { if (client?.isOpen) await client.disconnect(); } catch { /* best effort cleanup */ }
    }
    if (!redisState.retryTimer) {
      redisState.retryTimer = setTimeout(() => {
        redisState.retryTimer = null;
        void initializeRedis(io, socketTenantRooms, userRooms);
      }, 10000);
      redisState.retryTimer.unref?.();
    }
  }
};
