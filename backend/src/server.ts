import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabaseWithRetry, disconnectDatabase } from './db/mongoose.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  const app = createApp();

  // Bind explicitly to all interfaces — a PaaS routes to the container from
  // outside, so binding to localhost would make the app unreachable.
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  // The HTTP server comes up first so the platform's health check gets an
  // answer straight away; /api/health reports "degraded" until Mongo lands.
  await connectDatabaseWithRetry();

  const shutdown = (signal: string) => async () => {
    logger.info(`${signal} received — shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    // Don't let a hung connection hold the process open forever.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', shutdown('SIGTERM'));
  process.on('SIGINT', shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — exiting');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start the API');
  process.exit(1);
});
