import * as anchor from "@coral-xyz/anchor";
import {
  createMarketplaceClient,
  fetchMarketplace,
  fetchMarketplaceListings,
} from "../index";

async function main() {
  const wallet = anchor.Wallet.local();

  const { program, connection } = createMarketplaceClient(wallet);

  console.log("Network:", connection.rpcEndpoint);
  console.log("Program ID:", program.programId.toBase58());

  const marketplace = await fetchMarketplace(program);

  console.log("\nMarketplace:");
  console.log("Name:", marketplace.name);
  console.log("Admin:", marketplace.admin.toBase58());
  console.log("Fee:", marketplace.fee, "lamports");

  const listings = await fetchMarketplaceListings(program);

  console.log("\nActive listings:", listings.length);

  for (const item of listings) {
    console.log({
      listing: item.publicKey.toBase58(),
      maker: item.account.maker.toBase58(),
      nftMint: item.account.makerMint.toBase58(),
      priceLamports: item.account.price.toString(),
    });
  }
}

main().catch((error) => {
  console.error("SDK example failed:", error);
  process.exit(1);
});
