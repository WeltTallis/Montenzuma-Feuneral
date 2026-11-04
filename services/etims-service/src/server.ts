import KRAeTimsSDK from './index';
import logger from '../utils/logger';

const sdk = new KRAeTimsSDK({ server: true });

sdk.start().catch((error: unknown) => {
  logger.error('Failed to start KRA eTIMS server', error);
  process.exitCode = 1;
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}; shutting down KRA eTIMS server`);
  await sdk.stop();
  process.exit(0);
}

process.once('SIGINT', () => {
  void shutdown('SIGINT').catch((error: unknown) => {
    logger.error('Failed to stop KRA eTIMS server', error);
    process.exitCode = 1;
  });
});
process.once('SIGTERM', () => {
  void shutdown('SIGTERM').catch((error: unknown) => {
    logger.error('Failed to stop KRA eTIMS server', error);
    process.exitCode = 1;
  });
});
