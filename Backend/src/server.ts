import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.log(
    `ModuLedger Backend running at http://localhost:${env.port}`
  );

  console.log(
    `Health check: http://localhost:${env.port}/api/health`
  );
});

/**
 * Handle server errors
 */
server.on('error', (error) => {
  console.error('Backend server error:', error);
  process.exitCode = 1;
});

/**
 * Graceful shutdown
 */
function shutdown(): void {
  console.log('Shutting down ModuLedger Backend...');

  server.close(() => {
    console.log('Backend server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
