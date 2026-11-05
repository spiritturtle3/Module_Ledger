import { PublicKey } from "@solana/web3.js";

export const MODULEDGER_CONFIG = {
  network: "devnet",
  rpcUrl: "https://api.devnet.solana.com",
  programId: new PublicKey(
    "AuR4iqjMWbEmHTpKHyKcNbT3ggSAWrcZdudwCcjPuEBT",
  ),
  marketplaceName: "moduledger-demo",
  marketplace: new PublicKey(
    "A8L1MGXwkbRT96dxEEk3WjUQN96Q16ZELrEuiPjssS2A",
  ),
  rewardsMint: new PublicKey(
    "ERCWaMXdY2sLCFaCnEcS8msBeQqFu8U9Nq16JjatBDR8",
  ),
  treasury: new PublicKey(
    "3L8wJgS5uMLULivcTsdoGdwMCpZb8NGKisCYu2Ltf936",
  ),
} as const;
