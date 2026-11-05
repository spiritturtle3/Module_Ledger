import type { Request, Response, NextFunction } from "express";

import { unlink } from "node:fs/promises";

import {
  uploadFileToPinata,
  uploadMetadataToPinata,
} from "../services/pinata.service.js";

import { isValidIpfsMetadata } from "../validators/ipfs.validator.js";

import { HttpError } from "../utils/http-error.js";

/**
 * Upload model file to IPFS.
 */
export async function uploadModelFile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const file = req.file;

  if (!file) {
    next(
      new HttpError(
        400,
        "No file uploaded. Use the form-data field named file.",
      ),
    );

    return;
  }

  try {
    const result = await uploadFileToPinata(
      file.path,
      file.originalname,
      file.mimetype,
    );

    res.status(201).json({
      success: true,

      message: "File uploaded to IPFS successfully.",

      data: {
        cid: result.cid,

        ipfsUri: `ipfs://${result.cid}`,

        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.cid}`,

        size: result.size,

        timestamp: result.timestamp,
      },
    });
  } catch (error) {
    next(error);
  } finally {
    try {
      await unlink(file.path);
    } catch (cleanupError) {
      console.error("Temporary file cleanup failed:", cleanupError);
    }
  }
}

/**
 * Upload NFT metadata to IPFS.
 */
export async function uploadNftMetadata(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const metadata: unknown = req.body;

    if (!isValidIpfsMetadata(metadata)) {
      throw new HttpError(
        400,
        "Invalid metadata. Required fields: name, image, task, framework, version, creatorWallet, licenseRef, and modelFile containing a valid CID and matching IPFS URI. Description is optional.",
      );
    }

    const result = await uploadMetadataToPinata(metadata);

    res.status(201).json({
      success: true,

      message: "NFT metadata uploaded successfully.",

      data: {
        cid: result.cid,

        ipfsUri: `ipfs://${result.cid}`,

        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.cid}`,

        size: result.size,

        timestamp: result.timestamp,
      },
    });
  } catch (error) {
    next(error);
  }
}
