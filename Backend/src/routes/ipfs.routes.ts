import { Router } from "express";
import rateLimit from "express-rate-limit";

import upload from "../middleware/upload.middleware.js";
import { validateFileSignature } from "../middleware/file-signature.middleware.js";

import {
  uploadModelFile,
  uploadNftMetadata,
} from "../controllers/ipfs.controller.js";

import { env } from "../config/env.js";

const router = Router();

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.ipfsRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many upload requests. Please try again later.",
  },
});

/**
 * POST /api/ipfs/upload-file
 * Upload AI model files and images.
 */
router.post(
  "/upload-file",
  uploadLimiter,
  upload.single("file"),
  validateFileSignature,
  uploadModelFile,
);

/**
 * POST /api/ipfs/upload-metadata
 * Upload NFT metadata.
 */
router.post("/upload-metadata", uploadLimiter, uploadNftMetadata);

export default router;
