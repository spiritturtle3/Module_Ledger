import app from './app.js';
import { env } from './config/env.js';
import { startChainIndexer, stopChainIndexer } from './services/chain-indexer.service.js';

const server = app.listen(env.port, () => {
  console.log(`ModuLedger Backend running at http://localhost:${env.port}`);
  console.log(`Health check: http://localhost:${env.port}/api/health`);
  console.log(`Solana health: http://localhost:${env.port}/api/solana/health`);

  // The HTTP server remains available even when localnet or MongoDB is offline.
  void startChainIndexer();
});

server.on('error', (error) => {
  console.error('Backend server error:', error);
  process.exitCode = 1;
});

function shutdown(): void {
  console.log('Shutting down ModuLedger Backend...');
  void stopChainIndexer().finally(() => {
    server.close(() => {
      console.log('Backend server closed.');
      process.exit(0);
    });
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
