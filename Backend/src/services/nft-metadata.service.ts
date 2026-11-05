import axios from 'axios';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from '@metaplex-foundation/umi';
import {
  fetchDigitalAsset,
  getMplTokenMetadataProgram,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import type { PublicKey } from '@solana/web3.js';
import { env } from '../config/env.js';

export interface NftMetadataResult {
  mint: string;
  name: string;
  symbol: string | null;
  uri: string | null;
  image: string | null;
  description: string | null;
  collectionMint: string | null;
  collectionVerified: boolean;
  attributes: Array<{ trait_type: string; value: string }>;
}

const umi = createUmi(env.solanaRpcUrl).use(mplTokenMetadata());

// Override the SDK's default Token Metadata program with the configured address.
// This keeps the metadata program ID in environment configuration, like the Anchor program ID.
const registeredMetadataProgram = getMplTokenMetadataProgram(umi);
umi.programs.add(
  {
    ...registeredMetadataProgram,
    publicKey: publicKey(env.metadataProgramId),
  },
  true,
);

function cleanOnChainText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\0/g, '').trim() : '';
}

function toGatewayUrl(uri: string): string | null {
  if (uri.startsWith('ipfs://')) {
    const path = uri.slice('ipfs://'.length).replace(/^ipfs\//, '');
    if (!path || path.includes('..')) return null;
    return `${env.ipfsGatewayUrl}/${path}`;
  }

  try {
    const parsed = new URL(uri);
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      host === '127.0.0.1' ||
      host === '::1' ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

async function fetchJsonMetadata(uri: string): Promise<Record<string, unknown>> {
  const url = toGatewayUrl(uri);
  if (!url) return {};

  try {
    const response = await axios.get<unknown>(url, {
      timeout: env.nftMetadataTimeoutMs,
      maxContentLength: 2 * 1024 * 1024,
      maxBodyLength: 2 * 1024 * 1024,
      responseType: 'json',
      headers: { Accept: 'application/json' },
    });

    if (
      response.data === null ||
      typeof response.data !== 'object' ||
      Array.isArray(response.data)
    ) {
      return {};
    }

    return response.data as Record<string, unknown>;
  } catch {
    // Metadata JSON is off-chain and may be unavailable. On-chain fields remain usable.
    return {};
  }
}

function normalizeImage(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return toGatewayUrl(value.trim());
}

export async function fetchNftMetadata(mint: PublicKey): Promise<NftMetadataResult> {
  const asset = await fetchDigitalAsset(umi, publicKey(mint.toBase58()));
  if (!asset.edition || asset.edition.isOriginal !== true) {
    throw new Error('Mint does not have a Metaplex Master Edition account.');
  }

  const onChain = asset.metadata as unknown as Record<string, unknown>;
  const name = cleanOnChainText(onChain.name) || `NFT ${mint.toBase58().slice(0, 8)}`;
  const symbol = cleanOnChainText(onChain.symbol) || null;
  const uri = cleanOnChainText(onChain.uri) || null;

  let collectionMint: string | null = null;
  let collectionVerified = false;
  const collectionOption = onChain.collection as
    | { __option?: string; value?: { key?: { toString(): string }; verified?: boolean } }
    | null
    | undefined;

  if (collectionOption?.__option === 'Some' && collectionOption.value?.key) {
    collectionMint = collectionOption.value.key.toString();
    collectionVerified = collectionOption.value.verified === true;
  }

  const json = uri ? await fetchJsonMetadata(uri) : {};
  const attributes = Array.isArray(json.attributes)
    ? json.attributes.flatMap((item) => {
        if (
          item &&
          typeof item === 'object' &&
          typeof (item as Record<string, unknown>).trait_type === 'string' &&
          typeof (item as Record<string, unknown>).value === 'string'
        ) {
          return [{
            trait_type: (item as Record<string, unknown>).trait_type as string,
            value: (item as Record<string, unknown>).value as string,
          }];
        }
        return [];
      })
    : [];

  return {
    mint: mint.toBase58(),
    name,
    symbol,
    uri,
    image: normalizeImage(json.image),
    description: typeof json.description === 'string' ? json.description : null,
    collectionMint,
    collectionVerified,
    attributes,
  };
}
