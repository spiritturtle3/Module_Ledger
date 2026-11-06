import * as anchor from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

import {
  createNft,
  findMetadataPda,
  findMasterEditionPda,
  mplTokenMetadata,
  verifySizedCollectionItem,
} from "@metaplex-foundation/mpl-token-metadata";

import {
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
} from "@metaplex-foundation/umi";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

const COLLECTION_MINT = "Gc4UXzL27XyQAP2CMEazE8kVDxGSmXWjonmPhkA51JJR";

const MODEL_METADATA_URI =
  "ipfs://bafkreiei2cozob5xpqvtm6lebodlhl4653ouvwtyg7pz7og3vgc3hpleq4";

async function main() {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as NodeWallet;

  if (!provider.connection.rpcEndpoint.includes("devnet")) {
    throw new Error("Safety check failed: Devnet only.");
  }

  const umi = createUmi(provider.connection);

  const keypair = umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(wallet.payer.secretKey),
  );

  const authority = createSignerFromKeypair(umi, keypair);

  umi.use(keypairIdentity(authority));
  umi.use(mplTokenMetadata());

  const collectionMint = publicKey(COLLECTION_MINT);
  const modelMint = generateSigner(umi);

  console.log("Collection:", COLLECTION_MINT);
  console.log("Model NFT mint:", modelMint.publicKey.toString());

  // Create the model NFT as an unverified member of the collection.
  await createNft(umi, {
    mint: modelMint,
    name: "ModuLedger Demo Model",
    symbol: "MODU",
    uri: MODEL_METADATA_URI,
    sellerFeeBasisPoints: percentAmount(5.5),
    creators: [
      {
        address: umi.identity.publicKey,
        verified: true,
        share: 100,
      },
    ],
    collection: {
      key: collectionMint,
      verified: false,
    },
    isMutable: true,
  }).sendAndConfirm(umi);

  // Derive the model NFT metadata PDA.
  const metadata = findMetadataPda(umi, {
    mint: modelMint.publicKey,
  });

  // Derive the collection metadata PDA.
  const collection = findMetadataPda(umi, {
    mint: collectionMint,
  });

  // Derive the collection master edition PDA.
  const collectionMasterEditionAccount = findMasterEditionPda(umi, {
    mint: collectionMint,
  });

  // Verify the model NFT's collection membership.
  await verifySizedCollectionItem(umi, {
    payer: authority,
    metadata,
    collectionMint,
    collection,
    collectionMasterEditionAccount,
    collectionAuthority: umi.identity,
  }).sendAndConfirm(umi);

  console.log("Model NFT created and collection verified.");
  console.log("Collection mint:", COLLECTION_MINT);
  console.log("Model NFT mint:", modelMint.publicKey.toString());
}

main().catch((error) => {
  console.error("Model NFT creation failed:", error);
  process.exit(1);
});
