import * as anchor from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

async function main() {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as NodeWallet;

  if (!provider.connection.rpcEndpoint.includes("devnet")) {
    throw new Error("Safety check failed: this script must run on Devnet.");
  }

  const umi = createUmi(provider.connection);

  const authorityKeypair = umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(wallet.payer.secretKey),
  );

  const authority = createSignerFromKeypair(umi, authorityKeypair);

  umi.use(keypairIdentity(authority));
  umi.use(mplTokenMetadata());

  const collectionMint = generateSigner(umi);

  console.log("Network:", provider.connection.rpcEndpoint);
  console.log("Collection authority:", wallet.publicKey.toBase58());
  console.log("New collection mint:", collectionMint.publicKey.toString());

  await createNft(umi, {
    mint: collectionMint,
    name: "ModuLedger Collection",
    symbol: "MODU",
    uri: "https://sidd-metadata.s3.ap-south-1.amazonaws.com/metadata-1742751740128.json",
    sellerFeeBasisPoints: percentAmount(5.5),
    creators: [
      {
        address: umi.identity.publicKey,
        verified: true,
        share: 100,
      },
    ],
    isMutable: true,
    collectionDetails: { __kind: "V1", size: 0 },
  }).sendAndConfirm(umi);

  console.log("Collection created successfully.");
  console.log("Collection mint:", collectionMint.publicKey.toString());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
