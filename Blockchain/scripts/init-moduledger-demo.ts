import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { HackNft } from "../target/types/hack_nft";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.HackNft as anchor.Program<HackNft>;

  const name = "moduledger-demo";

  const marketplace = new PublicKey(
    "A8L1MGXwkbRT96dxEEk3WjUQN96Q16ZELrEuiPjssS2A"
  );
  const rewardsMint = new PublicKey(
    "ERCWaMXdY2sLCFaCnEcS8msBeQqFu8U9Nq16JjatBDR8"
  );
  const treasury = new PublicKey(
    "3L8wJgS5uMLULivcTsdoGdwMCpZb8NGKisCYu2Ltf936"
  );

  await program.methods
    .initialize(name, new anchor.BN(1))
    .accountsPartial({
      admin: provider.wallet.publicKey,
      marketplace,
      rewardMint: rewardsMint,
      treasury,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  const balance = await provider.connection.getBalance(treasury);

  if (balance === 0) {
    const signature = await provider.sendAndConfirm(
      new anchor.web3.Transaction().add(
        SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: treasury,
          lamports: 0.01 * LAMPORTS_PER_SOL,
        })
      )
    );
    console.log("Treasury funded:", signature);
  }

  console.log("Marketplace initialized:", marketplace.toBase58());
  console.log("Rewards mint:", rewardsMint.toBase58());
  console.log("Treasury:", treasury.toBase58());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
