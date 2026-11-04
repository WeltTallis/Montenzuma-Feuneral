import KRAeTimsSDK from '../src';
import config from '../config';

const sdk = new KRAeTimsSDK({ server: true });

sdk.start(config.port).then(() => {
  console.log(`KRA eTIMS SDK server running on port ${config.port}`);
}).catch((error: unknown) => {
  console.error('Failed to start server:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function shutdown(): Promise<void> {
  await sdk.stop();
  process.exit(0);
}

process.once('SIGINT', () => {
  void shutdown().catch((error: unknown) => {
    console.error('Error stopping server:', error);
    process.exitCode = 1;
  });
});
