import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { HackNft } from "../target/types/hack_nft";
import { MODULEDGER_CONFIG } from "./config";
import { deriveListingPda } from "./pda";

export async function fetchMarketplace(
  program: anchor.Program<HackNft>,
  marketplace: PublicKey = MODULEDGER_CONFIG.marketplace,
) {
  return program.account.marketplace.fetch(marketplace);
}

export async function fetchListing(
  program: anchor.Program<HackNft>,
  nftMint: PublicKey,
  marketplace: PublicKey = MODULEDGER_CONFIG.marketplace,
) {
  const listing = deriveListingPda(marketplace, nftMint);

  return program.account.listing.fetchNullable(listing);
}

export async function fetchMarketplaceListings(
  program: anchor.Program<HackNft>,
  marketplace: PublicKey = MODULEDGER_CONFIG.marketplace,
) {
  const allListings = await program.account.listing.all();

  return allListings.filter(({ account, publicKey }) => {
    const expectedListing = deriveListingPda(
      marketplace,
      account.makerMint,
    );

    return publicKey.equals(expectedListing);
  });
}
