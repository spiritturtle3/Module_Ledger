import { getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';
import { solanaConnection } from '../blockchain/connection.js';
import { deriveMarketplaceAddresses, requireMarketplaceName } from '../blockchain/pda.js';
import { hackNftProgram } from '../blockchain/program.js';
import { COLLECTION_MINT, PROGRAM_ID } from '../blockchain/constants.js';

export async function getMarketplaceSnapshot() {
  let marketplaceName: string;
  try {
    marketplaceName = requireMarketplaceName();
  } catch (error) {
    throw new HttpError(503, error instanceof Error ? error.message : 'Marketplace is not configured.');
  }

  const addresses = deriveMarketplaceAddresses(marketplaceName);
  let marketplaceInfo;

  try {
    marketplaceInfo = await solanaConnection.getAccountInfo(
      addresses.marketplace,
      env.solanaCommitment,
    );
  } catch (error) {
    throw new HttpError(
      503,
      `Could not read Marketplace from the local validator: ${
        error instanceof Error ? error.message : 'RPC request failed.'
      }`,
    );
  }

  if (!marketplaceInfo) {
    throw new HttpError(404, 'Marketplace account was not found on the configured local validator.');
  }

  if (!marketplaceInfo.owner.equals(PROGRAM_ID)) {
    throw new HttpError(502, 'Marketplace address is not owned by the configured program.');
  }

  let account;
  try {
    account = await hackNftProgram.account.marketplace.fetch(addresses.marketplace);
  } catch {
    throw new HttpError(502, 'Marketplace account exists but could not be decoded with the bundled Anchor IDL.');
  }

  const [treasuryLamports, minimumTreasuryLamports] = await Promise.all([
    solanaConnection.getBalance(addresses.treasury, env.solanaCommitment),
    solanaConnection.getMinimumBalanceForRentExemption(0, env.solanaCommitment),
  ]);

  let rewardsDecimals: number | null = null;
  try {
    const rewardMint = await getMint(
      solanaConnection,
      addresses.rewardsMint,
      env.solanaCommitment,
      TOKEN_PROGRAM_ID,
    );
    rewardsDecimals = rewardMint.decimals;
  } catch {
    // Report missing/unreadable mint as null, rather than inventing a decimal count.
  }

  const feeLamports = BigInt(String(account.fee));

  return {
    name: String(account.name),
    address: addresses.marketplace.toBase58(),
    admin: account.admin.toBase58(),
    feeLamports: feeLamports.toString(),
    feeMode: 'flat_lamports_currently',
    treasury: {
      address: addresses.treasury.toBase58(),
      balanceLamports: String(treasuryLamports),
      rentExemptMinimumLamports: String(minimumTreasuryLamports),
      fundedForRentExemption: treasuryLamports >= minimumTreasuryLamports,
    },
    rewardsMint: {
      address: addresses.rewardsMint.toBase58(),
      decimals: rewardsDecimals,
    },
    collectionPolicy: COLLECTION_MINT
      ? { mode: 'configured_allow_list', collectionMint: COLLECTION_MINT.toBase58() }
      : { mode: 'any_verified_collection', collectionMint: null },
    cluster: env.solanaCluster,
    commitment: env.solanaCommitment,
  };
}
