export interface ModelFileReference {
  cid: string;
  uri: string;
}

export interface IpfsMetadata {
  name: string;
  description?: string;
  image: string;

  task: string;
  framework: string;
  version: string;

  creatorWallet: string;
  licenseRef: string;

  modelFile: ModelFileReference;

  [key: string]: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

/**
 * Supports CIDv0 and common CIDv1 encodings.
 */
function isValidCid(value: string): boolean {
  const cidV0 = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  const cidV1Base32 = /^b[a-z2-7]{20,}$/;
  const cidV1Base58 = /^z[1-9A-HJ-NP-Za-km-z]{20,}$/;

  return (
    cidV0.test(value) || cidV1Base32.test(value) || cidV1Base58.test(value)
  );
}

/**
 * Validate a Solana public key as a 32-byte Base58 value.
 */
function isValidSolanaWallet(value: string): boolean {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  if (value.length < 32 || value.length > 44) {
    return false;
  }

  let decoded = 0n;

  for (const character of value) {
    const digit = alphabet.indexOf(character);

    if (digit === -1) {
      return false;
    }

    decoded = decoded * 58n + BigInt(digit);
  }

  const leadingZeros = value.match(/^1*/)?.[0].length ?? 0;

  const hex = decoded === 0n ? "" : decoded.toString(16);

  const decodedBytes = Math.ceil(hex.length / 2);

  return leadingZeros + decodedBytes === 32;
}

function isValidResourceUri(value: string): boolean {
  if (value.startsWith("ipfs://")) {
    const cid = value.slice("ipfs://".length).split(/[/?#]/)[0];

    return Boolean(cid && isValidCid(cid));
  }

  try {
    const url = new URL(value);

    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

export function isValidIpfsMetadata(value: unknown): value is IpfsMetadata {
  if (!isRecord(value)) {
    return false;
  }

  const metadata = value;

  if (
    !isNonEmptyString(metadata.name, 100) ||
    !isNonEmptyString(metadata.image, 2048) ||
    !isNonEmptyString(metadata.task, 100) ||
    !isNonEmptyString(metadata.framework, 100) ||
    !isNonEmptyString(metadata.version, 50) ||
    !isNonEmptyString(metadata.creatorWallet, 44) ||
    !isNonEmptyString(metadata.licenseRef, 2048)
  ) {
    return false;
  }

  if (
    metadata.description !== undefined &&
    !isNonEmptyString(metadata.description, 2000)
  ) {
    return false;
  }

  if (
    !isValidResourceUri(metadata.image) ||
    !isValidResourceUri(metadata.licenseRef) ||
    !isValidSolanaWallet(metadata.creatorWallet)
  ) {
    return false;
  }

  if (!isRecord(metadata.modelFile)) {
    return false;
  }

  const modelFile = metadata.modelFile;

  if (
    !isNonEmptyString(modelFile.cid, 128) ||
    !isNonEmptyString(modelFile.uri, 256)
  ) {
    return false;
  }

  if (
    !isValidCid(modelFile.cid) ||
    modelFile.uri !== `ipfs://${modelFile.cid}`
  ) {
    return false;
  }

  return true;
}
