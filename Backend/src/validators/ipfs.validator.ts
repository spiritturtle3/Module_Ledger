export interface ModelFileReference {
  cid: string;
  uri: string;
}

export interface MetadataAttribute {
  trait_type: string;
  value: string;
}

export interface MetadataFile {
  uri: string;
  type: string;
  cdn?: boolean;
}

export interface MetadataProperties {
  files: MetadataFile[];
  category: string;
}

export interface IpfsMetadata {
  name: string;
  description: string;
  image: string;
  attributes: MetadataAttribute[];
  properties: MetadataProperties;
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

function isValidCid(value: string): boolean {
  const cidV0 = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  const cidV1Base32 = /^b[a-z2-7]{20,}$/;
  const cidV1Base58 = /^z[1-9A-HJ-NP-Za-km-z]{20,}$/;

  return (
    cidV0.test(value) || cidV1Base32.test(value) || cidV1Base58.test(value)
  );
}

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

function hasRequiredAttribute(
  attributes: MetadataAttribute[],
  traitType: string,
  expectedValue: string,
): boolean {
  return attributes.some(
    (attribute) =>
      attribute.trait_type.toLowerCase() === traitType.toLowerCase() &&
      attribute.value === expectedValue,
  );
}

export function isValidIpfsMetadata(value: unknown): value is IpfsMetadata {
  if (!isRecord(value)) {
    return false;
  }

  const metadata = value;

  if (
    !isNonEmptyString(metadata.name, 100) ||
    !isNonEmptyString(metadata.description, 2000) ||
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
    !isNonEmptyString(modelFile.uri, 256) ||
    !isValidCid(modelFile.cid) ||
    modelFile.uri !== `ipfs://${modelFile.cid}`
  ) {
    return false;
  }

  if (
    !Array.isArray(metadata.attributes) ||
    !metadata.attributes.every(
      (attribute) =>
        isRecord(attribute) &&
        isNonEmptyString(attribute.trait_type, 100) &&
        isNonEmptyString(attribute.value, 256),
    )
  ) {
    return false;
  }

  const attributes = metadata.attributes as MetadataAttribute[];

  if (
    !hasRequiredAttribute(attributes, "Task", metadata.task) ||
    !hasRequiredAttribute(attributes, "Framework", metadata.framework) ||
    !hasRequiredAttribute(attributes, "Version", metadata.version)
  ) {
    return false;
  }

  if (!isRecord(metadata.properties)) {
    return false;
  }

  const properties = metadata.properties;

  if (properties.category !== "image" || !Array.isArray(properties.files)) {
    return false;
  }

  const files = properties.files;

  const validFiles = files.every(
    (file) =>
      isRecord(file) &&
      isNonEmptyString(file.uri, 2048) &&
      isNonEmptyString(file.type, 100) &&
      isValidResourceUri(file.uri) &&
      (file.cdn === undefined || typeof file.cdn === "boolean"),
  );

  if (!validFiles) {
    return false;
  }

  const hasImageFile = files.some(
    (file) =>
      isRecord(file) &&
      file.uri === metadata.image &&
      ["image/png", "image/jpeg", "image/webp"].includes(file.type as string),
  );

  const hasModelPackage = files.some(
    (file) =>
      isRecord(file) &&
      file.uri === modelFile.uri &&
      file.type === "application/zip",
  );

  return hasImageFile && hasModelPackage;
}
