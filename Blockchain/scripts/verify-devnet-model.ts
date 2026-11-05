import * as anchor from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

import {
  fetchDigitalAsset,
  findMasterEditionPda,
  findMetadataPda,
  mplTokenMetadata,
  verifySizedCollectionItem,
} from "@metaplex-foundation/mpl-token-metadata";

import {
  createSignerFromKeypair,
  keypairIdentity,
  publicKey,
  unwrapOption,
} from "@metaplex-foundation/umi";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

const DEVNET_RPC = "https://api.devnet.solana.com";

const COLLECTION_MINT = "2nJPccGnaZjjtRchVpJWH5bo4HdZzUk964UfQPHKDDyH";

const EXPECTED_AUTHORITY = "9gEhqja83pNACqP9aorWgAnPpx6Z4Jtj9geVABF6WmQx";

async function main() {
  const modelMintAddress = process.argv[2];

  if (!modelMintAddress) {
    throw new Error(
      "Usage: yarn ts-node scripts/verify-devnet-model.ts <MODEL_NFT_MINT>",
    );
  }

  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as NodeWallet;

  // Strict Devnet safety check.
  if (provider.connection.rpcEndpoint.replace(/\/+$/, "") !== DEVNET_RPC) {
    throw new Error("Safety check failed: Devnet RPC is required.");
  }

  // Only the existing collection authority may sign.
  if (wallet.publicKey.toBase58() !== EXPECTED_AUTHORITY) {
    throw new Error(
      "Unauthorized wallet: connected wallet is not the configured collection authority.",
    );
  }

  const modelMint = publicKey(modelMintAddress);
  const collectionMint = publicKey(COLLECTION_MINT);

  if (modelMint === collectionMint) {
    throw new Error("The collection NFT cannot be verified as its own item.");
  }

  const umi = createUmi(provider.connection);

  const authorityKeypair = umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(wallet.payer.secretKey),
  );

  const authority = createSignerFromKeypair(umi, authorityKeypair);

  umi.use(keypairIdentity(authority));
  umi.use(mplTokenMetadata());

  console.log("Network:", provider.connection.rpcEndpoint);
  console.log("Authority:", wallet.publicKey.toBase58());
  console.log("Collection:", COLLECTION_MINT);
  console.log("Model NFT:", modelMintAddress);

  // Fetch both assets directly from Devnet.
  const [collectionAsset, modelAsset] = await Promise.all([
    fetchDigitalAsset(umi, collectionMint),
    fetchDigitalAsset(umi, modelMint),
  ]);

  // Verify the canonical collection is a sized V1 collection.
  const collectionDetails = unwrapOption(
    collectionAsset.metadata.collectionDetails,
  );

  if (!collectionDetails || collectionDetails.__kind !== "V1") {
    throw new Error("Canonical collection is not a sized V1 collection.");
  }

  // Verify the connected wallet is the collection update authority.
  if (
    collectionAsset.metadata.updateAuthority.toString() !==
    wallet.publicKey.toBase58()
  ) {
    throw new Error(
      "Connected wallet is not the collection's current update authority.",
    );
  }

  if (collectionAsset.edition?.isOriginal !== true) {
    throw new Error("Canonical collection Master Edition was not found.");
  }

  // Inspect the model NFT's declared collection.
  const nftCollection = unwrapOption(modelAsset.metadata.collection);

  if (!nftCollection) {
    throw new Error("Model NFT has no collection metadata.");
  }

  if (nftCollection.key.toString() !== COLLECTION_MINT) {
    throw new Error(
      `Wrong collection. Expected ${COLLECTION_MINT}, received ${nftCollection.key}.`,
    );
  }

  if (nftCollection.verified) {
    console.log(
      "Collection membership is already verified. No transaction needed.",
    );
    return;
  }

  if (modelAsset.edition?.isOriginal !== true) {
    throw new Error("Model NFT Master Edition was not found.");
  }

  // Dry-run mode: validate everything without submitting a transaction.
  if (process.argv.includes("--dry-run")) {
    console.log("DRY RUN: All checks passed. No transaction submitted.");
    return;
  }

  console.log("All checks passed. Submitting verification transaction...");

  const metadata = findMetadataPda(umi, {
    mint: modelMint,
  });

  const collection = findMetadataPda(umi, {
    mint: collectionMint,
  });

  const collectionMasterEditionAccount = findMasterEditionPda(umi, {
    mint: collectionMint,
  });

  // Submit collection verification.
  const result = await verifySizedCollectionItem(umi, {
    payer: authority,
    metadata,
    collectionMint,
    collection,
    collectionMasterEditionAccount,
    collectionAuthority: umi.identity,
  }).sendAndConfirm(umi);

  // Convert the signature bytes into Base58 for Solana Explorer.
  const bs58Module: any = require("bs58");
  const encodeBase58 = bs58Module.encode ?? bs58Module.default?.encode;

  if (typeof encodeBase58 !== "function") {
    throw new Error(
      "Could not load the Base58 encoder for transaction signature formatting.",
    );
  }

  const signature = encodeBase58(result.signature);

  console.log("Verification transaction:", signature);
  console.log(
    "Explorer:",
    `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
  );

  // Fetch metadata again and independently confirm the result.
  const updatedAsset = await fetchDigitalAsset(umi, modelMint);

  const updatedCollection = unwrapOption(updatedAsset.metadata.collection);

  if (
    !updatedCollection ||
    updatedCollection.key.toString() !== COLLECTION_MINT ||
    !updatedCollection.verified
  ) {
    throw new Error("Post-transaction verification check failed.");
  }

  console.log(
    "SUCCESS: Model NFT belongs to the verified canonical collection.",
  );
}

main().catch((error) => {
  console.error("Collection verification failed:", error);
  process.exit(1);
});
