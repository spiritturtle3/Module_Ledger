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

export interface ListingEligibility {
  canList: boolean;
  message: string;
}

async function getNftCollection(connection: Connection, mint: PublicKey) {
  // Read metadata from the same RPC cluster used for marketplace transactions.
  const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());
  const asset = await fetchDigitalAsset(umi, umiPublicKey(mint.toBase58()));
  return unwrapOption(asset.metadata.collection);
}

export async function readVerifiedCollectionMembership(
  connection: Connection,
  mint: PublicKey,
): Promise<boolean> {
  const collection = await getNftCollection(connection, mint);
  return collection?.verified === true && collection.key.toString() === COLLECTION.toBase58();
}

/** Read-only checks. Never signs a transaction or weakens the on-chain verified-collection rule. */
export async function inspectListingEligibility(
  connection: Connection,
  owner: PublicKey,
  mintText: string,
): Promise<ListingEligibility> {
  let mint: PublicKey;
  try {
    mint = new PublicKey(mintText.trim());
  } catch {
    return { canList: false, message: "Enter a valid Solana NFT mint address (case-sensitive)." };
  }

  let collection;
  try {
    collection = await getNftCollection(connection, mint);
  } catch (error) {
    throw new Error(`Could not load NFT metadata on Devnet: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!collection) {
    return { canList: false, message: "This NFT has no collection reference. Only ModuLedger collection NFTs can be listed." };
  }
  if (collection.key.toString() !== COLLECTION.toBase58()) {
    return {
      canList: false,
      message: `This NFT belongs to a different collection (${collection.key.toString()}). Mint a new NFT in the current ModuLedger collection; the old NFT cannot be relinked by changing the website configuration.`,
    };
  }
  if (!collection.verified) {
    return {
      canList: false,
      message: "NFT is in the correct collection but is not verified yet. The authorized collection wallet must approve and verify it before listing.",
    };
  }

  // Checking the mint itself prevents a zero-decimal fungible token from being listed as an NFT.
  const mintAccount = await connection.getParsedAccountInfo(mint, "confirmed");
  const mintData = mintAccount.value?.data;
  if (!mintData || !("parsed" in mintData)) {
    return { canList: false, message: "Could not read this NFT's SPL Token mint on Devnet." };
  }
  const parsedMint = mintData.parsed as { info?: { supply?: string; decimals?: number } };
  if (parsedMint.info?.supply !== "1" || parsedMint.info?.decimals !== 0) {
    return { canList: false, message: "This mint must have total supply 1 and zero decimals." };
  }

  const ownerAta = deriveAta(owner, mint);
  try {
    const balance = await connection.getTokenAccountBalance(ownerAta, "confirmed");
    if (balance.value.amount !== "1" || balance.value.decimals !== 0) {
      return { canList: false, message: "Your connected wallet does not hold exactly one of this NFT." };
    }
  } catch (error) {
    // A missing associated token account is expected if another wallet owns the NFT.
    const account = await connection.getAccountInfo(ownerAta, "confirmed");
    if (!account) {
      return { canList: false, message: "This NFT is not in the connected wallet. Connect the owning Phantom wallet." };
    }
    throw error;
  }

  const listingAddress = deriveListing(mint);
  if (await connection.getAccountInfo(listingAddress, "confirmed")) {
    return { canList: false, message: "This NFT already has an on-chain listing. Refresh the marketplace to view or delist it." };
  }
  return { canList: true, message: "Ready to list: correct verified collection, unique NFT, and wallet ownership confirmed." };
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
        if (!(await readVerifiedCollectionMembership(connection, mint))) return null;
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
  const eligibility = await inspectListingEligibility(connection, wallet.publicKey, mintText);
  if (!eligibility.canList) throw new Error(eligibility.message);
  const makerAta = await assertOneOwnedNft(connection, wallet.publicKey, mint);

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
  if (!(await readVerifiedCollectionMembership(connection, mint))) {
    throw new Error("NFT collection verification no longer matches the configured ModuLedger collection. Refresh listings.");
  }
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
