import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../idl/hack_nft.json";
import { HackNft } from "../target/types/hack_nft";
import { MODULEDGER_CONFIG } from "./config";

export function createMarketplaceClient(
  wallet: anchor.Wallet,
  rpcUrl: string = MODULEDGER_CONFIG.rpcUrl,
) {
  const connection = new Connection(rpcUrl, "confirmed");

  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    },
  );

  const program = new anchor.Program(
    idl as anchor.Idl,
    provider,
  ) as anchor.Program<HackNft>;

  return {
    connection,
    provider,
    program,
    programId: new PublicKey(MODULEDGER_CONFIG.programId),
  };
}
