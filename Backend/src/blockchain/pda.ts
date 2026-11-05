import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { env } from '../config/env.js';
import { PROGRAM_ID } from './constants.js';

export function requireMarketplaceName(): string {
  if (!env.marketplaceName) {
    throw new Error(
      'MARKETPLACE_NAME is not configured. The Blockchain team must provide the fixed marketplace name.',
    );
  }

  if (Buffer.byteLength(env.marketplaceName, 'utf8') > 32) {
    throw new Error('MARKETPLACE_NAME must be no more than 32 UTF-8 bytes.');
  }

  return env.marketplaceName;
}

export function deriveMarketplacePda(
  marketplaceName = requireMarketplaceName(),
): [PublicKey, number] {
  if (Buffer.byteLength(marketplaceName, 'utf8') > 32) {
    throw new Error('Marketplace name exceeds the 32-byte limit.');
  }

  return PublicKey.findProgramAddressSync(
    [Buffer.from('marketplace', 'utf8'), Buffer.from(marketplaceName, 'utf8')],
    PROGRAM_ID,
  );
}

export function deriveRewardsMintPda(
  marketplacePda: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('rewards', 'utf8'), marketplacePda.toBuffer()],
    PROGRAM_ID,
  );
}

export function deriveTreasuryPda(
  marketplacePda: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('treasury', 'utf8'), marketplacePda.toBuffer()],
    PROGRAM_ID,
  );
}

export function deriveListingPda(
  marketplacePda: PublicKey,
  mint: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [marketplacePda.toBuffer(), mint.toBuffer()],
    PROGRAM_ID,
  );
}

/**
 * The Listing PDA is an off-curve owner. allowOwnerOffCurve must be true.
 */
export async function deriveVaultAta(
  listingPda: PublicKey,
  mint: PublicKey,
): Promise<PublicKey> {
  return getAssociatedTokenAddress(mint, listingPda, true);
}

export function deriveMarketplaceAddresses(marketplaceName = requireMarketplaceName()) {
  const [marketplace, marketplaceBump] = deriveMarketplacePda(marketplaceName);
  const [rewardsMint, rewardsBump] = deriveRewardsMintPda(marketplace);
  const [treasury, treasuryBump] = deriveTreasuryPda(marketplace);

  return {
    marketplace,
    marketplaceBump,
    rewardsMint,
    rewardsBump,
    treasury,
    treasuryBump,
  };
}
