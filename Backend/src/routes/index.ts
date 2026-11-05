import { Router } from 'express';
import ipfsRoutes from './ipfs.routes.js';
import solanaRoutes from './solana.routes.js';

const router = Router();

/**
 * GET /api/health
 * Check backend process status. Solana availability has its own health endpoint.
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'ModuLedger Backend is running.',
    service: 'moduledger-backend',
    timestamp: new Date().toISOString(),
  });
});

router.use('/ipfs', ipfsRoutes);
router.use('/solana', solanaRoutes);

export default router;
