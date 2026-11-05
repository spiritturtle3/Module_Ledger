import { PublicKey } from "@solana/web3.js";
import { MODULEDGER_CONFIG } from "./config";

const PROGRAM_ID = MODULEDGER_CONFIG.programId;

export function deriveMarketplacePda(name: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), Buffer.from(name)],
    PROGRAM_ID,
  )[0];
}

export function deriveTreasuryPda(marketplace: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), marketplace.toBuffer()],
    PROGRAM_ID,
  )[0];
}

export function deriveRewardsMintPda(marketplace: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("rewards"), marketplace.toBuffer()],
    PROGRAM_ID,
  )[0];
}

export function deriveListingPda(
  marketplace: PublicKey,
  nftMint: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [marketplace.toBuffer(), nftMint.toBuffer()],
    PROGRAM_ID,
  )[0];
}
