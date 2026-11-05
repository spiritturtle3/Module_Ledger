import bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';
import { getAccount, getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';
import { solanaConnection } from '../blockchain/connection.js';
import { COLLECTION_MINT, LISTING_DISCRIMINATOR, PROGRAM_ID } from '../blockchain/constants.js';
import {
  deriveListingPda,
  deriveMarketplacePda,
  deriveVaultAta,
  requireMarketplaceName,
} from '../blockchain/pda.js';
import { hackNftProgram } from '../blockchain/program.js';
import { NftCacheModel } from '../models/nft-cache.model.js';
import { isDatabaseConnected } from '../config/database.js';
import { fetchNftMetadata, type NftMetadataResult } from './nft-metadata.service.js';

export interface VerifiedListing {
  listingAddress: string;
  marketplace: string;
  maker: string;
  mint: string;
  priceLamports: string;
  priceSol: string;
  vaultAddress: string;
  collectionMint: string;
  name: string;
  symbol: string | null;
  metadataUri: string | null;
  image: string | null;
  description: string | null;
  attributes: Array<{ trait_type: string; value: string }>;
}

function formatLamportsAsSol(lamports: string): string {
  const value = BigInt(lamports);
  const whole = value / 1_000_000_000n;
  const fraction = (value % 1_000_000_000n).toString().padStart(9, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

async function cacheMetadata(metadata: NftMetadataResult): Promise<void> {
  if (!isDatabaseConnected()) return;

  await NftCacheModel.updateOne(
    { mint: metadata.mint },
    {
      $set: {
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        image: metadata.image,
        description: metadata.description,
        collectionMint: metadata.collectionMint,
        collectionVerified: metadata.collectionVerified,
        attributes: metadata.attributes,
        fetchedAt: new Date(),
      },
    },
    { upsert: true },
  );
}

async function buildVerifiedListing(
  listingAddress: PublicKey,
  marketplace: PublicKey,
  maker: PublicKey,
  mint: PublicKey,
  priceLamports: string,
): Promise<VerifiedListing | null> {
  const [expectedListing] = deriveListingPda(marketplace, mint);
  if (!expectedListing.equals(listingAddress)) return null;

  const vaultAddress = await deriveVaultAta(listingAddress, mint);

  // The marketplace currently supports legacy SPL Token NFTs only: supply 1, decimals 0.
  try {
    const mintState = await getMint(
      solanaConnection,
      mint,
      env.solanaCommitment,
      TOKEN_PROGRAM_ID,
    );
    if (mintState.supply !== 1n || mintState.decimals !== 0) return null;
  } catch {
    return null;
  }

  let vault;
  try {
    vault = await getAccount(
      solanaConnection,
      vaultAddress,
      env.solanaCommitment,
      TOKEN_PROGRAM_ID,
    );
  } catch {
    return null;
  }

  // The token account must be for this mint, owned by the Listing PDA, and hold exactly one NFT.
  if (
    !vault.mint.equals(mint) ||
    !vault.owner.equals(listingAddress) ||
    vault.amount !== 1n
  ) {
    return null;
  }

  let metadata: NftMetadataResult;
  try {
    metadata = await fetchNftMetadata(mint);
  } catch {
    return null;
  }

  // Listings require a verified collection. If the team later configures an allow-list,
  // enforce it here; until then, accept any verified collection.
  if (!metadata.collectionVerified || !metadata.collectionMint) return null;
  if (COLLECTION_MINT && metadata.collectionMint !== COLLECTION_MINT.toBase58()) return null;

  try {
    await cacheMetadata(metadata);
  } catch (error) {
    // A cache outage must not hide a listing that has been verified against chain state.
    console.warn('[NFT cache] Could not update metadata cache:', error);
  }

  return {
    listingAddress: listingAddress.toBase58(),
    marketplace: marketplace.toBase58(),
    maker: maker.toBase58(),
    mint: mint.toBase58(),
    priceLamports,
    priceSol: formatLamportsAsSol(priceLamports),
    vaultAddress: vaultAddress.toBase58(),
    collectionMint: metadata.collectionMint,
    name: metadata.name,
    symbol: metadata.symbol,
    metadataUri: metadata.uri,
    image: metadata.image,
    description: metadata.description,
    attributes: metadata.attributes,
  };
}

export async function getVerifiedListingByMint(mintInput: string): Promise<VerifiedListing | null> {
  let mint: PublicKey;
  try {
    mint = new PublicKey(mintInput);
  } catch {
    throw new HttpError(400, 'Invalid NFT mint address.');
  }

  let marketplaceName: string;
  try {
    marketplaceName = requireMarketplaceName();
  } catch (error) {
    throw new HttpError(503, error instanceof Error ? error.message : 'Marketplace is not configured.');
  }

  const [marketplace] = deriveMarketplacePda(marketplaceName);
  const [listingAddress] = deriveListingPda(marketplace, mint);

  let listingInfo;
  try {
    listingInfo = await solanaConnection.getAccountInfo(
      listingAddress,
      env.solanaCommitment,
    );
  } catch (error) {
    throw new HttpError(
      503,
      `Could not read Listing from the local validator: ${
        error instanceof Error ? error.message : 'RPC request failed.'
      }`,
    );
  }
  if (!listingInfo) return null;
  if (!listingInfo.owner.equals(PROGRAM_ID)) {
    throw new HttpError(502, 'Listing address is not owned by the configured program.');
  }

  let listingAccount;
  try {
    listingAccount = await hackNftProgram.account.listing.fetch(listingAddress);
  } catch {
    throw new HttpError(502, 'Listing account exists but could not be decoded with the bundled Anchor IDL.');
  }

  return buildVerifiedListing(
    listingAddress,
    marketplace,
    listingAccount.maker,
    listingAccount.makerMint,
    String(listingAccount.price),
  );
}

export async function getVerifiedMarketplaceListings(): Promise<VerifiedListing[]> {
  let marketplaceName: string;
  try {
    marketplaceName = requireMarketplaceName();
  } catch (error) {
    throw new HttpError(503, error instanceof Error ? error.message : 'Marketplace is not configured.');
  }

  const [marketplace] = deriveMarketplacePda(marketplaceName);
  const discriminatorBase58 = bs58.encode(LISTING_DISCRIMINATOR);

  // Filter by the 8-byte Listing discriminator. Do not filter by data size:
  // Marketplace and Listing accounts are both 81 bytes.
  let accounts;
  try {
    accounts = await hackNftProgram.account.listing.all([
      {
        memcmp: {
          offset: 0,
          bytes: discriminatorBase58,
        },
      },
    ]);
  } catch (error) {
    throw new HttpError(
      503,
      `Could not fetch Listing accounts from the local validator: ${
        error instanceof Error ? error.message : 'RPC request failed.'
      }`,
    );
  }

  const verified: VerifiedListing[] = [];

  for (const item of accounts) {
    const mint = item.account.makerMint as PublicKey;
    const [expectedListing] = deriveListingPda(marketplace, mint);

    // Listing does not store its marketplace; validate its PDA against this marketplace.
    if (!expectedListing.equals(item.publicKey)) continue;

    const listing = await buildVerifiedListing(
      item.publicKey,
      marketplace,
      item.account.maker as PublicKey,
      mint,
      String(item.account.price),
    );

    if (listing) verified.push(listing);
  }

  return verified;
}

