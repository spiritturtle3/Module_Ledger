import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { HackNft } from "../target/types/hack_nft";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.HackNft as anchor.Program<HackNft>;
  const programId = program.programId;

  const name = "moduledger-demo";
  const fee = 1;

  // Derive marketplace PDA.
  const [marketplace] = PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), Buffer.from(name)],
    programId,
  );

  // Derive rewards mint PDA.
  const [rewardsMint] = PublicKey.findProgramAddressSync(
    [Buffer.from("rewards"), marketplace.toBuffer()],
    programId,
  );

  // Derive treasury PDA.
  const [treasury] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), marketplace.toBuffer()],
    programId,
  );

  console.log("Network:", provider.connection.rpcEndpoint);
  console.log("Program ID:", programId.toBase58());
  console.log("Marketplace:", marketplace.toBase58());
  console.log("Rewards mint:", rewardsMint.toBase58());
  console.log("Treasury:", treasury.toBase58());

  // Initialize only if the marketplace does not already exist.
  const marketplaceAccount = await provider.connection.getAccountInfo(
    marketplace,
  );

  if (!marketplaceAccount) {
    await program.methods
      .initialize(name, fee)
      .accountsPartial({
        admin: provider.wallet.publicKey,
        marketplace,
        rewardMint: rewardsMint,
        treasury,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    console.log("Marketplace initialized.");
  } else {
    console.log("Marketplace already exists; skipping initialization.");
  }

  // Ensure treasury has at least 0.01 SOL.
  const minimumTreasuryBalance = 0.01 * LAMPORTS_PER_SOL;
  const balance = await provider.connection.getBalance(treasury);

  if (balance < minimumTreasuryBalance) {
    const signature = await provider.sendAndConfirm(
      new anchor.web3.Transaction().add(
        SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: treasury,
          lamports: minimumTreasuryBalance - balance,
        }),
      ),
    );
    console.log("Treasury funded:", signature);
  } else {
    console.log("Treasury already funded:", balance / LAMPORTS_PER_SOL, "SOL");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
