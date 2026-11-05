import "dotenv/config";

type SolanaCluster = "devnet" | "localnet";

function getPositiveNumber(name: string, defaultValue: number): number {
  const rawValue = process.env[name];
  if (!rawValue) return defaultValue;

  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid environment variable: ${name}`);
  }

  return value;
}

function getOptionalString(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function validateUrl(name: string, value: string, protocols: string[]): string {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid URL in environment variable: ${name}`);
  }

  if (!protocols.includes(parsed.protocol)) {
    throw new Error(`Unsupported protocol in environment variable: ${name}`);
  }

  return value;
}

// Devnet is the default network.
// Localnet remains available for optional local development.
const requestedCluster = (process.env.SOLANA_CLUSTER || "devnet")
  .trim()
  .toLowerCase();

if (requestedCluster !== "devnet" && requestedCluster !== "localnet") {
  throw new Error("SOLANA_CLUSTER must be either devnet or localnet.");
}

const solanaCluster: SolanaCluster = requestedCluster;

const defaultRpcUrl =
  solanaCluster === "devnet"
    ? "https://api.devnet.solana.com"
    : "http://127.0.0.1:8899";

const defaultWsUrl =
  solanaCluster === "devnet"
    ? "wss://api.devnet.solana.com"
    : "ws://127.0.0.1:8900";

const pinataJwt = process.env.PINATA_JWT?.trim();

if (!pinataJwt) {
  throw new Error("PINATA_JWT must be configured in Backend/.env");
}

const marketplaceName = getOptionalString("MARKETPLACE_NAME");

if (marketplaceName && Buffer.byteLength(marketplaceName, "utf8") > 32) {
  throw new Error("MARKETPLACE_NAME must be no more than 32 UTF-8 bytes.");
}

const solanaRpcUrl = validateUrl(
  "SOLANA_RPC_URL",
  process.env.SOLANA_RPC_URL || defaultRpcUrl,
  ["http:", "https:"],
);

const solanaWsUrl = validateUrl(
  "SOLANA_WS_URL",
  process.env.SOLANA_WS_URL || defaultWsUrl,
  ["ws:", "wss:"],
);

export const env = {
  port: getPositiveNumber("PORT", 5000),

  pinataJwt,

  frontendOrigins: (process.env.FRONTEND_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  maxFileSizeBytes: getPositiveNumber("MAX_FILE_SIZE_MB", 1024) * 1024 * 1024,

  pinataTimeoutMs: getPositiveNumber("PINATA_TIMEOUT_MS", 900000),

  ipfsRateLimitMax: getPositiveNumber("IPFS_RATE_LIMIT_MAX", 60),

  solanaCluster,
  solanaRpcUrl,
  solanaWsUrl,

  solanaCommitment: "confirmed" as const,

  programId:
    process.env.PROGRAM_ID?.trim() ||
    "AuR4iqjMWbEmHTpKHyKcNbT3ggSAWrcZdudwCcjPuEBT",

  metadataProgramId:
    process.env.METADATA_PROGRAM_ID?.trim() ||
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",

  marketplaceName,

  collectionMint: getOptionalString("COLLECTION_MINT"),

  mongodbUri: getOptionalString("MONGODB_URI"),

  solanaIndexerPollIntervalMs: getPositiveNumber(
    "SOLANA_INDEXER_POLL_INTERVAL_MS",
    15000,
  ),

  nftMetadataTimeoutMs: getPositiveNumber("NFT_METADATA_TIMEOUT_MS", 10000),

  ipfsGatewayUrl: (
    process.env.IPFS_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs"
  ).replace(/\/+$/, ""),
};
