import 'dotenv/config';

function getPositiveNumber(
  name: string,
  defaultValue: number
): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return defaultValue;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid environment variable: ${name}`);
  }

  return value;
}

const pinataJwt = process.env.PINATA_JWT?.trim();

if (!pinataJwt) {
  throw new Error(
    'PINATA_JWT must be configured in Backend/.env'
  );
}

export const env = {
  port: getPositiveNumber('PORT', 5000),

  pinataJwt,

  frontendOrigins: (
    process.env.FRONTEND_ORIGINS ||
    'http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  maxFileSizeBytes:
    getPositiveNumber('MAX_FILE_SIZE_MB', 1024) *
    1024 *
    1024,

  pinataTimeoutMs: getPositiveNumber(
    'PINATA_TIMEOUT_MS',
    900000
  ),

  ipfsRateLimitMax: getPositiveNumber(
    'IPFS_RATE_LIMIT_MAX',
    60
  ),
};
