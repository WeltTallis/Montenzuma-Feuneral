import Logger from '../../../packages/shared-logger/dist/index';

export const PORT = Number.parseInt(process.env.PORT || process.env.SOCKET_PORT || '5018', 10);

export const getRedisUrl = (): string => {
  try {
    if (process.env.REDIS_URL) return process.env.REDIS_URL;
    if (process.env.REDIS_HOST) {
      const password = process.env.REDIS_PASSWORD ? `:${encodeURIComponent(process.env.REDIS_PASSWORD)}@` : '';
      return `redis://${password}${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`;
    }
  } catch (error: any) {
    Logger.error({ message: 'Failed to construct Redis URL', error: error?.message || error });
  }
  return 'redis://redis:6379';
};

export const REDIS_URL = getRedisUrl();
