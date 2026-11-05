export type MarketplaceAction = "mint-model" | "verify-collection" | "list" | "delist" | "purchase";

export interface OnChainListingSnapshot {
  listingAddress: string;
  mintAddress: string;
  sellerAddress: string;
  priceLamports: bigint;
  vaultTokenAmount: bigint;
  vaultTokenDecimals: number;
}

export const REWARD_TOKEN_DECIMALS = 6;
export const BUYER_REWARD_BASE_UNITS = 1n;

export function isBuyableListing(listing: OnChainListingSnapshot): boolean {
  return listing.vaultTokenAmount === 1n && listing.vaultTokenDecimals === 0;
}

export function idlMatchesConfiguredProgram(
  idl: { address?: unknown },
  programId: string,
): boolean {
  return typeof idl.address === "string" && idl.address === programId;
}
