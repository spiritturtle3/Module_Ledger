export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

export const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? "http://127.0.0.1:8899";

export const SOLANA_PROGRAM_ID =
  process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID ?? "AuR4iqjMWbEmHTpKHyKcNbT3ggSAWrcZdudwCcjPuEBT";

export const MARKETPLACE_NAME = "moduledger-demo";

export const BLOCKCHAIN_INTEGRATION_STATUS = "unavailable" as const;
