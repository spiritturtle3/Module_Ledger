import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  deriveMarketplacePda,
  deriveListingPda,
  deriveRewardsMintPda,
  deriveTreasuryPda,
} from "./pda";
import { MODULEDGER_CONFIG } from "./config";

const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

export function deriveMetadataPda(mint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID,
  )[0];
}

export function deriveMasterEditionPda(mint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    METADATA_PROGRAM_ID,
  )[0];
}

export async function initializeMarketplace(
  program: anchor.Program,
  admin: PublicKey,
  name: string,
  fee: number,
) {
  const marketplace = deriveMarketplacePda(name);
  const treasury = deriveTreasuryPda(marketplace);
  const rewardsMint = deriveRewardsMintPda(marketplace);

  return program.methods
    .initialize(name, fee)
    .accountsPartial({
      admin,
      marketplace,
      treasury,
      rewardMint: rewardsMint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

export async function listNft(
  program: anchor.Program,
  maker: PublicKey,
  nftMint: PublicKey,
  collectionMint: PublicKey,
  priceLamports: number | anchor.BN,
  marketplace: PublicKey = MODULEDGER_CONFIG.marketplace,
) {
  const listing = deriveListingPda(marketplace, nftMint);
  const makerAta = await getAssociatedTokenAddress(nftMint, maker);
  const vault = await getAssociatedTokenAddress(nftMint, listing, true);

  return program.methods
    .listing(new anchor.BN(priceLamports))
    .accountsPartial({
      maker,
      marketplace,
      makerMint: nftMint,
      makerAta,
      vault,
      listing,
      collectionMint,
      metadata: deriveMetadataPda(nftMint),
      masterEdition: deriveMasterEditionPda(nftMint),
      metadataProgram: METADATA_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

export async function delistNft(
  program: anchor.Program,
  maker: PublicKey,
  nftMint: PublicKey,
  marketplace: PublicKey = MODULEDGER_CONFIG.marketplace,
) {
  const listing = deriveListingPda(marketplace, nftMint);
  const makerAta = await getAssociatedTokenAddress(nftMint, maker);
  const vault = await getAssociatedTokenAddress(nftMint, listing, true);

  return program.methods
    .delist()
    .accountsPartial({
      maker,
      makerMint: nftMint,
      marketplace,
      makerAta,
      vault,
      listing,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .rpc();
}

export async function purchaseNft(
  program: anchor.Program,
  taker: PublicKey,
  maker: PublicKey,
  nftMint: PublicKey,
  marketplace: PublicKey = MODULEDGER_CONFIG.marketplace,
) {
  const listing = deriveListingPda(marketplace, nftMint);
  const takerAta = await getAssociatedTokenAddress(nftMint, taker);
  const takerAtaReward = await getAssociatedTokenAddress(
    deriveRewardsMintPda(marketplace),
    taker,
  );
  const vault = await getAssociatedTokenAddress(nftMint, listing, true);

  return program.methods
    .purchase()
    .accountsPartial({
      taker,
      maker,
      marketplace,
      makerMint: nftMint,
      takerAta,
      takerAtaReward,
      listing,
      vault,
      treasury: deriveTreasuryPda(marketplace),
      rewardsMint: deriveRewardsMintPda(marketplace),
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}
