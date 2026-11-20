import { NextFunction, Request, Response } from 'express';
import { AppError } from './errors';
import { SocketHttpContext } from './context';

export const healthController = (context: SocketHttpContext) => (_req: Request, res: Response): void => {
  try {
    res.status(200).json({
      status: 'UP', service: 'socketio-service', version: '1.0.0', timestamp: new Date().toISOString(), uptime: process.uptime(),
      connections: { active: Number(context.io.engine.clientsCount) || 0, userRooms: context.userRooms.size },
      redis: { connected: context.redisConnected(), publisherReady: context.pubClient()?.isReady ?? false },
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error: any) {
    context.logger.error({ message: 'Health check error', error });
    res.status(500).json({ status: 'ERROR', error: error.message, timestamp: new Date().toISOString() });
  }
};

export const statsController = (context: SocketHttpContext) => (_req: Request, res: Response, next: NextFunction): void => {
  try {
    res.json({ activeConnections: Number(context.io.engine.clientsCount) || 0, userRooms: context.userRooms.size,
      redisConnected: context.redisConnected(), rooms: Array.from(context.io.sockets.adapter.rooms.keys()).filter((room) => room.startsWith('tenant_')), timestamp: new Date().toISOString() });
  } catch (error) { context.logger.error({ message: 'Stats error', error }); next(error); }
};

export const roomMembersController = (context: SocketHttpContext) => (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { room } = req.params;
    if (!room || typeof room !== 'string') throw new AppError('Invalid room name', 400);
    const members = context.io.sockets.adapter.rooms.get(room);
    res.json({ room, members: members ? Array.from(members) : [], count: members?.size || 0, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
};
