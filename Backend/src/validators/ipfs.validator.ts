export interface IpfsMetadata {
  name: string;

  image: string;

  description?: string;

  [key: string]: unknown;
}

export function isValidIpfsMetadata(
  value: unknown
): value is IpfsMetadata {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return false;
  }

  const metadata = value as Record<string, unknown>;

  return (
    typeof metadata.name === 'string' &&
    metadata.name.trim().length > 0 &&
    typeof metadata.image === 'string' &&
    metadata.image.trim().length > 0
  );
}
