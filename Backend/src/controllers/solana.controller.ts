import type { Request, Response, NextFunction } from "express";
import { PublicKey } from "@solana/web3.js";
import { env } from "../config/env.js";
import { deriveMarketplacePda } from "../blockchain/pda.js";
import { solanaConnection } from "../blockchain/connection.js";
import { PROGRAM_ID } from "../blockchain/constants.js";
import { getMarketplaceSnapshot } from "../services/marketplace.service.js";
import {
  getVerifiedListingByMint,
  getVerifiedMarketplaceListings,
} from "../services/listing.service.js";
import { isDatabaseConnected } from "../config/database.js";
import { ListingModel } from "../models/listing.model.js";
import { SaleModel } from "../models/sale.model.js";
import { getIndexerStatus } from "../services/chain-indexer.service.js";
import { HttpError } from "../utils/http-error.js";

export async function getSolanaHealth(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const [version, programAccount, genesisHash] = await Promise.all([
      solanaConnection.getVersion(),
      solanaConnection.getAccountInfo(PROGRAM_ID, env.solanaCommitment),
      solanaConnection.getGenesisHash(),
    ]);

    res.status(200).json({
      success: true,
      service: "solana-localnet",
      cluster: env.solanaCluster,
      rpcUrl: env.solanaRpcUrl,
      websocketUrl: env.solanaWsUrl,
      commitment: env.solanaCommitment,
      validator: {
        reachable: true,
        version,
        genesisHash,
      },
      program: {
        id: PROGRAM_ID.toBase58(),
        deployed: Boolean(programAccount),
        executable: programAccount?.executable ?? false,
      },
      marketplaceConfigured: Boolean(env.marketplaceName),
      databaseConnected: isDatabaseConnected(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: "solana-localnet",
      cluster: env.solanaCluster,
      rpcUrl: env.solanaRpcUrl,
      websocketUrl: env.solanaWsUrl,
      validator: { reachable: false },
      program: {
        id: PROGRAM_ID.toBase58(),
        deployed: false,
      },
      message:
        error instanceof Error
          ? error.message
          : "Could not reach the local validator.",
    });
  }
}

export async function getMarketplace(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const marketplace = await getMarketplaceSnapshot();

    res.status(200).json({
      success: true,
      data: marketplace,
    });
  } catch (error) {
    next(error);
  }
}

export async function getListings(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const listings = await getVerifiedMarketplaceListings();

    res.status(200).json({
      success: true,
      count: listings.length,
      data: listings,
    });
  } catch (error) {
    next(error);
  }
}

export async function getListing(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const mintParam = req.params.mint;
    const mint = Array.isArray(mintParam) ? mintParam[0] : mintParam;

    if (typeof mint !== "string" || mint.length === 0) {
      throw new HttpError(400, "Invalid NFT mint address.");
    }

    // Validate early so malformed keys return HTTP 400.
    try {
      new PublicKey(mint);
    } catch {
      throw new HttpError(400, "Invalid NFT mint address.");
    }

    const listing = await getVerifiedListingByMint(mint);

    if (!listing) {
      throw new HttpError(
        404,
        "No active, escrow-verified listing was found for this NFT.",
      );
    }

    res.status(200).json({
      success: true,
      data: listing,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMarketplaceHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!isDatabaseConnected()) {
      res.status(200).json({
        success: true,
        enabled: false,
        message:
          "MongoDB is not configured or connected. On-chain active listing reads remain available.",
        data: {
          listings: [],
          sales: [],
        },
      });
      return;
    }

    const parsedLimit = Number(req.query.limit ?? 50);
    const limit = Number.isInteger(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 50;

    if (!env.marketplaceName) {
      throw new HttpError(503, "MARKETPLACE_NAME is not configured.");
    }

    const [marketplace] = deriveMarketplacePda(env.marketplaceName);

    const listingFilter: Record<string, any> = {
      marketplace: marketplace.toBase58(),
    };

    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;

    if (status && ["active", "delisted", "sold", "orphaned"].includes(status)) {
      listingFilter.status = status;
    }

    const [listings, sales] = await Promise.all([
      ListingModel.find(listingFilter)
        .sort({ createdSlot: -1 })
        .limit(limit)
        .lean()
        .exec(),

      SaleModel.find({
        marketplace: marketplace.toBase58(),
      })
        .sort({ slot: -1 })
        .limit(limit)
        .lean()
        .exec(),
    ]);

    res.status(200).json({
      success: true,
      enabled: true,
      data: {
        listings,
        sales,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getChainSyncStatus(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.status(200).json({
      success: true,
      data: await getIndexerStatus(),
    });
  } catch (error) {
    next(error);
  }
}
