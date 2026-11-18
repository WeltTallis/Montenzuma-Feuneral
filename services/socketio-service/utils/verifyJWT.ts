
import Logger from '../../../packages/shared-logger/dist/index';
import { AppError } from '../controllers/errors';
import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';


type SocketNext = (error?: Error) => void;

const getHandshakeToken = (socket: Socket): string | undefined => {
  const cookieToken = socket.handshake.headers.cookie
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('access_token='))
    ?.slice('access_token='.length);

  return socket.handshake.auth?.token
    || socket.handshake.headers.authorization?.split(' ')[1]
    || (cookieToken ? decodeURIComponent(cookieToken) : undefined);
};

export const verifyJWT = (socket: Socket, next: SocketNext): void => {
  try {
    const token = getHandshakeToken(socket);
    if (!token) {
      if (process.env.NODE_ENV === 'production') {
        const error = new AppError('Authentication required', 401, null, 'AUTH_REQUIRED');
        Logger.warn({ message: 'Socket handshake rejected: no token provided', origin: socket.handshake.headers.origin });
        return next(error);
      }
      socket.data.authenticated = false;
      return next();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) return next(new AppError('JWT_SECRET is not configured', 500));

    const decoded = jwt.verify(token, secret) as any;
    socket.data.authenticated = true;
    socket.data.user = decoded;
    socket.data.userId = decoded.userId || decoded.user_id || decoded.id;
    socket.data.tenantSlug = decoded.tenantSlug || decoded.tenant_slug;
    Logger.info({ message: 'Socket authenticated', userId: socket.data.userId, tenantSlug: socket.data.tenantSlug });
    return next();
  } catch (error: any) {
    Logger.warn({ message: 'Socket handshake rejected: invalid token', error: error?.message || error });
    const authError = new AppError('Invalid authentication token', 401, null, 'INVALID_TOKEN');
    return next(authError);
  }
};
