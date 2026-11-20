import { Server as SocketIOServer } from 'socket.io';

export interface UserRoom {
  tenantSlug: string;
  userId: string;
  userRole: string;
  connectedAt: Date;
}

export interface RedisNotificationClient {
  isReady: boolean;
  setEx(key: string, seconds: number, value: string): Promise<unknown>;
}

export interface SocketHttpContext {
  io: SocketIOServer;
  logger: { info(data: any): unknown; warn(data: any): unknown; error(data: any): unknown };
  redisConnected: () => boolean;
  pubClient: () => RedisNotificationClient | null;
  userRooms: ReadonlyMap<string, UserRoom>;
  resolveOrgRooms: (tenantSlug: string) => string[];
}
