import { Router } from 'express';

import ipfsRoutes from './ipfs.routes.js';

const router = Router();

/**
 * GET /api/health
 * Check backend status.
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'ModuLedger Backend is running.',
    service: 'moduledger-backend',
    timestamp: new Date().toISOString(),
  });
});

/**
 * IPFS routes
 */
router.use('/ipfs', ipfsRoutes);

export default router;
