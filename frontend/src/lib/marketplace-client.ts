import { AnchorProvider, BN, Program, type Provider } from "@anchor-lang/core";
import {
  fetchDigitalAsset,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as umiPublicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { unwrapOption } from "@metaplex-foundation/umi-options";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  type Connection,
} from "@solana/web3.js";
import idl from "../../../Blockchain/idl/hack_nft.json";
import type { HackNft } from "../../../Blockchain/idl/hack_nft";
import {
  COLLECTION_MINT,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_NAME,
  REWARDS_MINT,
  SOLANA_PROGRAM_ID,
  SOLANA_RPC_ENDPOINT,
  TREASURY_ADDRESS,
} from "@/lib/config";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const PROGRAM_ID = new PublicKey(SOLANA_PROGRAM_ID);
const MARKETPLACE = new PublicKey(MARKETPLACE_ADDRESS);
const TREASURY = new PublicKey(TREASURY_ADDRESS);
const REWARDS = new PublicKey(REWARDS_MINT);
const COLLECTION = new PublicKey(COLLECTION_MINT);

export interface ListingRow {
  address: string;
  maker: string;
  mint: string;
  priceLamports: bigint;
}

export function assertConfiguredPdas(): void {
  const marketplace = PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), Buffer.from(MARKETPLACE_NAME)],
    PROGRAM_ID,
  )[0];
  const treasury = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), marketplace.toBuffer()],
    PROGRAM_ID,
  )[0];
  const rewards = PublicKey.findProgramAddressSync(
    [Buffer.from("rewards"), marketplace.toBuffer()],
    PROGRAM_ID,
  )[0];

  if (!marketplace.equals(MARKETPLACE) || !treasury.equals(TREASURY) || !rewards.equals(REWARDS)) {
    throw new Error("Configured Devnet marketplace addresses do not match the IDL PDA seeds.");
  }
}

function deriveListing(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [MARKETPLACE.toBuffer(), mint.toBuffer()],
    PROGRAM_ID,
  )[0];
}

function deriveAta(owner: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

function deriveMetadata(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    METADATA_PROGRAM_ID,
  )[0];
}

function deriveMasterEdition(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from("edition")],
    METADATA_PROGRAM_ID,
  )[0];
}

export function parseListingPrice(input: string): bigint {
  const match = /^(\d+)(?:\.(\d{1,9}))?$/.exec(input.trim());
  if (!match) throw new Error("Enter a SOL price with up to nine decimal places.");
  const whole = BigInt(match[1]);
  const fractional = BigInt((match[2] ?? "").padEnd(9, "0") || "0");
  const lamports = whole * BigInt(LAMPORTS_PER_SOL) + fractional;
  if (lamports <= 0n) throw new Error("Listing price must be greater than zero.");
  if (lamports > 18_446_744_073_709_551_615n) throw new Error("Price exceeds the on-chain u64 limit.");
  return lamports;
}

export function createMarketplaceProgram(connection: Connection, wallet?: AnchorWallet) {
  assertConfiguredPdas();
  if (idl.address !== PROGRAM_ID.toBase58()) {
    throw new Error("Bundled workspace IDL does not match the configured Devnet program ID.");
  }
  const provider: Provider = wallet
    ? new AnchorProvider(
        connection,
        wallet,
        { commitment: "confirmed", preflightCommitment: "confirmed" },
      )
    : { connection };
  return new Program<HackNft>(idl as HackNft, provider);
}

export async function readVerifiedCollectionMembership(
  mint: PublicKey,
): Promise<boolean> {
  const umi = createUmi(SOLANA_RPC_ENDPOINT).use(mplTokenMetadata());
  const asset = await fetchDigitalAsset(umi, umiPublicKey(mint.toBase58()));
  const collection = unwrapOption(asset.metadata.collection);
  return collection?.verified === true && collection.key === umiPublicKey(COLLECTION.toBase58());
}

async function assertOneOwnedNft(connection: Connection, owner: PublicKey, mint: PublicKey) {
  const ata = deriveAta(owner, mint);
  const balance = await connection.getTokenAccountBalance(ata, "confirmed");
  if (balance.value.amount !== "1" || balance.value.decimals !== 0) {
    throw new Error("The connected wallet must hold exactly one token with zero decimals.");
  }
  return ata;
}

async function assertOneVaultNft(connection: Connection, listing: PublicKey, mint: PublicKey) {
  const vault = deriveAta(listing, mint);
  const balance = await connection.getTokenAccountBalance(vault, "confirmed");
  if (balance.value.amount !== "1" || balance.value.decimals !== 0) {
    throw new Error("This listing vault does not contain exactly one NFT and cannot be traded.");
  }
  return vault;
}

async function assertPriceExceedsFee(program: Program<HackNft>, price: bigint) {
  const marketplace = await program.account.marketplace.fetch(MARKETPLACE);
  const fee = BigInt(marketplace.fee);
  if (price <= fee) {
    throw new Error(`Listing price must exceed the ${fee.toString()} lamport marketplace fee.`);
  }
}

export async function fetchActiveListings(connection: Connection): Promise<ListingRow[]> {
  const program = createMarketplaceProgram(connection);
  const marketplace = await program.account.marketplace.fetch(MARKETPLACE);
  const fee = BigInt(marketplace.fee);
  const accounts = await program.account.listing.all();
  const rows = await Promise.all(
    accounts.map(async ({ publicKey, account }) => {
      const mint = account.makerMint;
      const listing = deriveListing(mint);
      const priceLamports = BigInt(account.price.toString());
      if (!listing.equals(publicKey) || priceLamports <= fee) return null;
      try {
        await assertOneVaultNft(connection, listing, mint);
        if (!(await readVerifiedCollectionMembership(mint))) return null;
        return {
          address: publicKey.toBase58(),
          maker: account.maker.toBase58(),
          mint: mint.toBase58(),
          priceLamports,
        } satisfies ListingRow;
      } catch {
        return null;
      }
    }),
  );
  return rows.filter((row): row is ListingRow => row !== null);
}

export async function listVerifiedNft(
  connection: Connection,
  wallet: AnchorWallet,
  mintText: string,
  price: bigint,
): Promise<string> {
  if (!wallet.publicKey) throw new Error("Connect a wallet before listing an NFT.");
  const mint = new PublicKey(mintText.trim());
  const program = createMarketplaceProgram(connection, wallet);
  await assertPriceExceedsFee(program, price);
  const makerAta = await assertOneOwnedNft(connection, wallet.publicKey, mint);
  if (!(await readVerifiedCollectionMembership(mint))) {
    throw new Error("Only NFTs verified in the canonical ModuLedger collection can be listed.");
  }

  const listing = deriveListing(mint);
  const vault = deriveAta(listing, mint);
  const signature = await program.methods
    .listing(new BN(price.toString()))
    .accountsPartial({
      maker: wallet.publicKey,
      marketplace: MARKETPLACE,
      makerMint: mint,
      makerAta,
      vault,
      listing,
      collectionMint: COLLECTION,
      metadata: deriveMetadata(mint),
      masterEdition: deriveMasterEdition(mint),
      metadataProgram: METADATA_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc({ commitment: "confirmed" });
  return signature;
}

export async function purchaseListing(
  connection: Connection,
  wallet: AnchorWallet,
  row: ListingRow,
): Promise<string> {
  if (!wallet.publicKey) throw new Error("Connect a wallet before purchasing.");
  if (wallet.publicKey.toBase58() === row.maker) throw new Error("You cannot purchase your own listing.");
  const listing = new PublicKey(row.address);
  const mint = new PublicKey(row.mint);
  if (!deriveListing(mint).equals(listing)) throw new Error("Listing address does not match this NFT mint.");
  const program = createMarketplaceProgram(connection, wallet);
  const account = await program.account.listing.fetch(listing);
  if (!account.maker.equals(new PublicKey(row.maker)) || !account.makerMint.equals(mint)) {
    throw new Error("Listing changed since it was loaded. Refresh and try again.");
  }
  const price = BigInt(account.price.toString());
  await assertPriceExceedsFee(program, price);
  const vault = await assertOneVaultNft(connection, listing, mint);
  const signature = await program.methods
    .purchase()
    .accountsPartial({
      taker: wallet.publicKey,
      maker: account.maker,
      marketplace: MARKETPLACE,
      makerMint: mint,
      takerAta: deriveAta(wallet.publicKey, mint),
      takerAtaReward: deriveAta(wallet.publicKey, REWARDS),
      listing,
      vault,
      treasury: TREASURY,
      rewardsMint: REWARDS,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc({ commitment: "confirmed" });
  return signature;
}

export async function delistOwnedNft(
  connection: Connection,
  wallet: AnchorWallet,
  mintText: string,
): Promise<string> {
  if (!wallet.publicKey) throw new Error("Connect a wallet before delisting.");
  const mint = new PublicKey(mintText);
  const listing = deriveListing(mint);
  const program = createMarketplaceProgram(connection, wallet);
  const account = await program.account.listing.fetch(listing);
  if (!account.maker.equals(wallet.publicKey) || !account.makerMint.equals(mint)) {
    throw new Error("Only the seller can delist this NFT.");
  }
  const signature = await program.methods
    .delist()
    .accountsPartial({
      maker: wallet.publicKey,
      makerMint: mint,
      marketplace: MARKETPLACE,
      makerAta: deriveAta(wallet.publicKey, mint),
      vault: deriveAta(listing, mint),
      listing,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .rpc({ commitment: "confirmed" });
  return signature;
}
