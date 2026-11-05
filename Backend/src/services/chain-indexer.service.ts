import bs58 from "bs58";
import type { PartiallyDecodedInstruction, PublicKey } from "@solana/web3.js";
import { connectDatabase, isDatabaseConnected } from "../config/database.js";
import { env } from "../config/env.js";
import { solanaConnection } from "../blockchain/connection.js";
import { PROGRAM_ID } from "../blockchain/constants.js";
import {
  deriveListingPda,
  deriveMarketplacePda,
  deriveVaultAta,
  requireMarketplaceName,
} from "../blockchain/pda.js";
import { hackNftProgram } from "../blockchain/program.js";
import hackNftIdlJson from "../blockchain/idl/hack_nft.json";
import { ListingModel } from "../models/listing.model.js";
import { SaleModel } from "../models/sale.model.js";
import { SyncStateModel } from "../models/sync-state.model.js";
import { fetchNftMetadata } from "./nft-metadata.service.js";
import { getMarketplaceSnapshot } from "./marketplace.service.js";
import { BorshCoder } from "@coral-xyz/anchor";
const SYNC_KEY = "hack-nft-program";

const instructionCoder = new BorshCoder(hackNftProgram.idl)
  .instruction as unknown as {
  decode(instructionData: Buffer): DecodedInstruction | null;
};
const MAX_SYNC_PAGES = 50;
let pollTimer: NodeJS.Timeout | undefined;
let syncInProgress = false;

type RuntimeInstruction = {
  name: string;
  accounts: Array<{ name: string }>;
};

type DecodedInstruction = {
  name: string;
  data: Record<string, unknown>;
};

function getInstructionDefinition(
  name: string,
): RuntimeInstruction | undefined {
  const idl = hackNftIdlJson as unknown as {
    instructions: RuntimeInstruction[];
  };
  return idl.instructions.find((instruction) => instruction.name === name);
}

function getAccountMap(
  instructionName: string,
  instruction: PartiallyDecodedInstruction,
): Map<string, PublicKey> {
  const definition = getInstructionDefinition(instructionName);
  if (!definition) return new Map();

  const result = new Map<string, PublicKey>();
  definition.accounts.forEach((account, index) => {
    const publicKey = instruction.accounts[index];
    if (publicKey) result.set(account.name, publicKey);
  });
  return result;
}

async function markActiveListingsOrphaned(marketplace: string): Promise<void> {
  await ListingModel.updateMany(
    { marketplace, status: "active" },
    { $set: { status: "orphaned" } },
  );
}

async function updateSyncState(values: Record<string, unknown>): Promise<void> {
  await SyncStateModel.updateOne(
    { key: SYNC_KEY },
    { $set: values, $setOnInsert: { key: SYNC_KEY } },
    { upsert: true },
  );
}

function getTokenBalanceForOwner(
  balances:
    | Array<{
        mint: string;
        owner?: string;
        uiTokenAmount: { amount: string };
      }>
    | null
    | undefined,
  mint: string,
  owner: string,
): bigint {
  return (balances ?? []).reduce((total, balance) => {
    if (balance.mint === mint && balance.owner === owner) {
      return total + BigInt(balance.uiTokenAmount.amount);
    }
    return total;
  }, 0n);
}

async function processSuccessfulTransaction(
  signature: string,
  slot: number,
): Promise<void> {
  const transaction = await solanaConnection.getParsedTransaction(signature, {
    commitment: env.solanaCommitment,
    maxSupportedTransactionVersion: 0,
  });
  if (!transaction) {
    throw new Error(
      `Confirmed signature ${signature} could not be fetched from the local validator.`,
    );
  }
  if (transaction.meta?.err) return;

  const [configuredMarketplace] = deriveMarketplacePda(
    requireMarketplaceName(),
  );
  const instructions = transaction.transaction.message.instructions;

  for (const parsedInstruction of instructions) {
    if (!("data" in parsedInstruction) || !("accounts" in parsedInstruction)) {
      continue;
    }

    const instruction = parsedInstruction as PartiallyDecodedInstruction;
    if (!instruction.programId.equals(PROGRAM_ID)) continue;

    let decoded: DecodedInstruction | null;
    try {
      decoded = instructionCoder.decode(
        Buffer.from(bs58.decode(instruction.data)),
      );
    } catch {
      continue;
    }
    if (!decoded) continue;

    const accounts = getAccountMap(decoded.name, instruction);
    const marketplace = accounts.get("marketplace");
    const makerMint = accounts.get("maker_mint");

    if (
      !marketplace ||
      !makerMint ||
      !marketplace.equals(configuredMarketplace)
    ) {
      continue;
    }

    const [listingAddress] = deriveListingPda(marketplace, makerMint);

    if (decoded.name === "listing") {
      // Historical listing accounts may already be closed by a later delist/purchase.
      // Reconstruct the event from the successful transaction, not today's account state.
      const maker = accounts.get("maker");
      const vaultAccount = accounts.get("vault");
      const priceValue = decoded.data?.price;
      if (
        !maker ||
        !vaultAccount ||
        priceValue === undefined ||
        priceValue === null
      ) {
        throw new Error(
          `Listing instruction ${signature} is missing maker, vault, or price data.`,
        );
      }

      const expectedVault = await deriveVaultAta(listingAddress, makerMint);
      if (!expectedVault.equals(vaultAccount)) {
        throw new Error(
          `Listing instruction ${signature} supplied a vault that does not match the derived ATA.`,
        );
      }

      const vaultAccountIndex =
        transaction.transaction.message.accountKeys.findIndex((accountKey) =>
          accountKey.pubkey.equals(vaultAccount),
        );
      const vaultTokenBalance = transaction.meta?.postTokenBalances?.find(
        (balance) =>
          balance.accountIndex === vaultAccountIndex &&
          balance.mint === makerMint.toBase58(),
      );
      if (
        vaultAccountIndex < 0 ||
        !vaultTokenBalance ||
        (vaultTokenBalance.owner &&
          vaultTokenBalance.owner !== listingAddress.toBase58()) ||
        BigInt(vaultTokenBalance.uiTokenAmount.amount) !== 1n
      ) {
        throw new Error(
          `Listing instruction ${signature} did not leave exactly one NFT in the derived listing vault.`,
        );
      }

      const priceLamports = BigInt(String(priceValue)).toString();
      let metadata: Awaited<ReturnType<typeof fetchNftMetadata>> | null = null;
      try {
        metadata = await fetchNftMetadata(makerMint);
      } catch (error) {
        // On-chain instruction success proves the program's listing constraints passed.
        // Off-chain metadata is optional for historical indexing.
        console.warn(
          `[Indexer] Metadata unavailable for historical listing ${makerMint.toBase58()}:`,
          error,
        );
      }

      await ListingModel.updateOne(
        { listingAddress: listingAddress.toBase58() },
        {
          $set: {
            listingAddress: listingAddress.toBase58(),
            marketplace: marketplace.toBase58(),
            maker: maker.toBase58(),
            mint: makerMint.toBase58(),
            priceLamports,
            vaultAddress: vaultAccount.toBase58(),
            collectionMint: metadata?.collectionMint ?? null,
            name: metadata?.name ?? `NFT ${makerMint.toBase58().slice(0, 8)}`,
            symbol: metadata?.symbol ?? null,
            metadataUri: metadata?.uri ?? null,
            image: metadata?.image ?? null,
            description: metadata?.description ?? null,
            attributes: metadata?.attributes ?? [],
            status: "active",
            createdSignature: signature,
            createdSlot: slot,
            closedSignature: null,
            closedSlot: null,
          },
        },
        { upsert: true },
      );
      continue;
    }

    if (decoded.name === "delist") {
      const maker = accounts.get("maker");
      if (!maker) continue;

      await ListingModel.updateOne(
        {
          listingAddress: listingAddress.toBase58(),
          maker: maker.toBase58(),
          status: "active",
        },
        {
          $set: {
            status: "delisted",
            closedSignature: signature,
            closedSlot: slot,
          },
        },
      );
      continue;
    }

    if (decoded.name === "purchase") {
      const maker = accounts.get("maker");
      const taker = accounts.get("taker");
      if (!maker || !taker) continue;

      const listing = await ListingModel.findOne({
        listingAddress: listingAddress.toBase58(),
      })
        .lean()
        .exec();

      // R2: never record a sale with an arbitrary payee. The transaction account must
      // match the maker already stored from the verified listing.
      if (!listing || listing.maker !== maker.toBase58()) {
        if (listing) {
          await ListingModel.updateOne(
            { listingAddress: listingAddress.toBase58() },
            {
              $set: {
                status: "orphaned",
                closedSignature: signature,
                closedSlot: slot,
              },
            },
          );
        }
        console.error(
          `[Indexer] Purchase ${signature} did not match the indexed listing maker; sale was not recorded.`,
        );
        continue;
      }

      const marketplaceSnapshot = await getMarketplaceSnapshot();
      const price = BigInt(listing.priceLamports);
      const fee = BigInt(marketplaceSnapshot.feeLamports);
      if (price <= fee) {
        console.error(
          `[Indexer] Purchase ${signature} has price <= fee; sale was not recorded.`,
        );
        continue;
      }

      const rewardMintAddress = marketplaceSnapshot.rewardsMint.address;
      const rewardBefore = getTokenBalanceForOwner(
        transaction.meta?.preTokenBalances,
        rewardMintAddress,
        taker.toBase58(),
      );
      const rewardAfter = getTokenBalanceForOwner(
        transaction.meta?.postTokenBalances,
        rewardMintAddress,
        taker.toBase58(),
      );
      const rewardBaseUnits =
        rewardAfter > rewardBefore
          ? (rewardAfter - rewardBefore).toString()
          : "0";

      await SaleModel.updateOne(
        { signature },
        {
          $setOnInsert: {
            signature,
            listingAddress: listingAddress.toBase58(),
            marketplace: marketplace.toBase58(),
            buyer: taker.toBase58(),
            maker: maker.toBase58(),
            mint: makerMint.toBase58(),
            priceLamports: price.toString(),
            feeLamports: fee.toString(),
            rewardBaseUnits,
            slot,
          },
        },
        { upsert: true },
      );

      await ListingModel.updateOne(
        { listingAddress: listingAddress.toBase58() },
        {
          $set: {
            status: "sold",
            closedSignature: signature,
            closedSlot: slot,
          },
        },
      );
    }
  }
}

async function syncOnce(): Promise<void> {
  if (syncInProgress || !isDatabaseConnected()) return;
  syncInProgress = true;

  try {
    const currentState = await SyncStateModel.findOne({ key: SYNC_KEY })
      .lean()
      .exec();
    const [configuredMarketplace] = deriveMarketplacePda(
      requireMarketplaceName(),
    );
    const configuredMarketplaceAddress = configuredMarketplace.toBase58();
    const programAccount = await solanaConnection.getAccountInfo(
      PROGRAM_ID,
      env.solanaCommitment,
    );

    if (!programAccount?.executable) {
      await markActiveListingsOrphaned(configuredMarketplaceAddress);
      await updateSyncState({
        status: "program_missing",
        lastError:
          "Program account is missing or is not executable on the configured local validator.",
        lastSyncedAt: new Date(),
      });
      return;
    }

    const genesisHash = await solanaConnection.getGenesisHash();
    let lastSignature = currentState?.lastSignature ?? null;

    if (currentState?.genesisHash && currentState.genesisHash !== genesisHash) {
      await markActiveListingsOrphaned(configuredMarketplaceAddress);
      lastSignature = null;
      await updateSyncState({
        lastSignature: null,
        lastSlot: null,
        genesisHash,
        status: "cursor_missing",
        lastError:
          "Local validator genesis hash changed. A fresh index is required.",
        resetDetectedAt: new Date(),
      });
      return;
    }

    const discovered: Array<{ signature: string; slot: number; err: unknown }> =
      [];
    let cursorFound = !lastSignature;
    let reachedEnd = false;
    let before: string | undefined;

    for (let pageNumber = 0; pageNumber < MAX_SYNC_PAGES; pageNumber += 1) {
      const options: { limit: number; before?: string } = { limit: 100 };
      if (before) options.before = before;

      const page = await solanaConnection.getSignaturesForAddress(
        PROGRAM_ID,
        options,
        env.solanaCommitment,
      );

      if (page.length === 0) {
        reachedEnd = true;
        break;
      }

      for (const item of page) {
        if (lastSignature && item.signature === lastSignature) {
          cursorFound = true;
          break;
        }
        discovered.push({
          signature: item.signature,
          slot: item.slot,
          err: item.err,
        });
      }

      if (lastSignature && cursorFound) break;
      before = page[page.length - 1].signature;

      if (page.length < 100) {
        reachedEnd = true;
        break;
      }
    }

    if (lastSignature && !cursorFound) {
      // The saved cursor disappeared. This is consistent with a wiped local ledger.
      // Keep historical sales, but stop serving old active rows as current chain state.
      await markActiveListingsOrphaned(configuredMarketplaceAddress);
      await updateSyncState({
        lastSignature: null,
        lastSlot: null,
        genesisHash,
        status: "cursor_missing",
        lastError:
          "Last indexed signature was not found in the local validator history. Active cache was orphaned; a fresh scan will begin on the next poll.",
        resetDetectedAt: new Date(),
      });
      return;
    }

    await updateSyncState({
      status: "syncing",
      genesisHash,
      lastError: null,
    });

    let transactionProcessingError: string | null = null;
    for (const item of discovered.reverse()) {
      try {
        if (!item.err) {
          await processSuccessfulTransaction(item.signature, item.slot);
        }
      } catch (error) {
        transactionProcessingError =
          error instanceof Error
            ? error.message
            : "Unknown transaction processing error";
        console.error(
          `[Indexer] Failed to process ${item.signature}; cursor was not advanced:`,
          error,
        );
        break;
      }

      // Persist cursor only after this transaction has been processed. If processing fails,
      // the next poll retries this signature instead of silently skipping it.
      await updateSyncState({
        lastSignature: item.signature,
        lastSlot: item.slot,
        genesisHash,
        status: "syncing",
        lastSyncedAt: new Date(),
      });
    }

    if (transactionProcessingError) {
      await updateSyncState({
        status: "offline",
        genesisHash,
        lastError: transactionProcessingError,
        lastSyncedAt: new Date(),
      });
      return;
    }

    const initialBackfillWasCapped = !lastSignature && !reachedEnd;
    const remainsPartial =
      initialBackfillWasCapped || currentState?.status === "partial";

    await updateSyncState({
      status: remainsPartial ? "partial" : "healthy",
      genesisHash,
      lastError: initialBackfillWasCapped
        ? `Initial/backfill scan reached the ${MAX_SYNC_PAGES * 100}-signature page limit. Older history may require a manual backfill.`
        : currentState?.status === "partial"
          ? currentState.lastError
          : null,
      lastSyncedAt: new Date(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown indexer error";
    await updateSyncState({
      status: "offline",
      lastError: message,
      lastSyncedAt: new Date(),
    }).catch(() => undefined);
    console.error("[Indexer] Sync attempt failed:", message);
  } finally {
    syncInProgress = false;
  }
}

export async function startChainIndexer(): Promise<void> {
  if (!env.mongodbUri) {
    console.log("[Indexer] Disabled: MONGODB_URI is not configured.");
    return;
  }

  if (!env.marketplaceName) {
    console.log(
      "[Indexer] Disabled: MARKETPLACE_NAME has not been finalized by the Blockchain team.",
    );
    return;
  }

  try {
    await connectDatabase();
  } catch (error) {
    console.error(
      "[Indexer] MongoDB connection failed; indexer was not started:",
      error,
    );
    return;
  }

  await syncOnce();
  if (!pollTimer) {
    pollTimer = setInterval(() => {
      void syncOnce();
    }, env.solanaIndexerPollIntervalMs);
    pollTimer.unref();
  }
}

export async function stopChainIndexer(): Promise<void> {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = undefined;
  }
}

export async function getIndexerStatus(): Promise<Record<string, unknown>> {
  if (!env.mongodbUri) {
    return { enabled: false, reason: "MONGODB_URI is not configured." };
  }
  if (!env.marketplaceName) {
    return { enabled: false, reason: "MARKETPLACE_NAME is not configured." };
  }
  if (!isDatabaseConnected()) {
    return { enabled: false, reason: "MongoDB is not connected." };
  }

  const state = await SyncStateModel.findOne({ key: SYNC_KEY }).lean().exec();
  return {
    enabled: true,
    status: state?.status ?? "idle",
    lastSignature: state?.lastSignature ?? null,
    lastSlot: state?.lastSlot ?? null,
    genesisHash: state?.genesisHash ?? null,
    lastError: state?.lastError ?? null,
    lastSyncedAt: state?.lastSyncedAt ?? null,
    resetDetectedAt: state?.resetDetectedAt ?? null,
    pollIntervalMs: env.solanaIndexerPollIntervalMs,
  };
}
