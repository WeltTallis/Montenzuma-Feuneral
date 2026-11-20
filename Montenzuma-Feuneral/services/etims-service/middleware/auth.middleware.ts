import type { RequestHandler } from 'express';
import { AuthenticationError } from '../utils/errors';

export const requireAuth: RequestHandler = (request, _response, next) => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ') || !authorization.slice(7).trim()) {
    next(new AuthenticationError('Authentication required'));
    return;
  }
  next();
};
