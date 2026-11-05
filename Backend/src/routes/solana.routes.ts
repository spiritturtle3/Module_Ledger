import { Router } from 'express';
import {
  getChainSyncStatus,
  getListing,
  getListings,
  getMarketplace,
  getMarketplaceHistory,
  getSolanaHealth,
} from '../controllers/solana.controller.js';

const router = Router();

router.get('/health', getSolanaHealth);
router.get('/marketplace', getMarketplace);
router.get('/listings', getListings);
router.get('/listings/:mint', getListing);
router.get('/history', getMarketplaceHistory);
router.get('/sync/status', getChainSyncStatus);

export default router;
