export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

export const SOLANA_CLUSTER = "devnet" as const;
export const SOLANA_RPC_ENDPOINT = "https://api.devnet.solana.com" as const;

export const SOLANA_PROGRAM_ID = "AuR4iqjMWbEmHTpKHyKcNbT3ggSAWrcZdudwCcjPuEBT" as const;

export const COLLECTION_MINT = "Gc4UXzL27XyQAP2CMEazE8kVDxGSmXWjonmPhkA51JJR" as const;
export const MARKETPLACE_NAME = "moduledger-demo" as const;
export const MARKETPLACE_ADDRESS = "A8L1MGXwkbRT96dxEEk3WjUQN96Q16ZELrEuiPjssS2A" as const;
export const TREASURY_ADDRESS = "3L8wJgS5uMLULivcTsdoGdwMCpZb8NGKisCYu2Ltf936" as const;
export const REWARDS_MINT = "ERCWaMXdY2sLCFaCnEcS8msBeQqFu8U9Nq16JjatBDR8" as const;

export function transactionExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function addressExplorerUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}