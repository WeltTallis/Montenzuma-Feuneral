import cors from 'cors';
import type { CorsOptions } from 'cors';
import config from '../config';
import logger from '../utils/logger';

export function configureCors() {
  const whitelist = config.cors.allowedOrigins;
  logger.info(`CORS whitelist configured with: ${whitelist.join(', ')}`);

  const options: CorsOptions = {
    origin(origin, callback) {
      if (!origin || whitelist.includes('*') || whitelist.includes(origin)) {
        callback(null, true);
        return;
      }
      logger.warn(`CORS origin blocked by whitelist: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
    exposedHeaders: config.cors.exposedHeaders,
    credentials: config.cors.credentials,
    maxAge: config.cors.maxAge,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  return cors(options);
}
