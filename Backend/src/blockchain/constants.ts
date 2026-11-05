import { PublicKey } from '@solana/web3.js';
import hackNftIdlJson from './idl/hack_nft.json';
import { env } from '../config/env.js';

type RuntimeAccountIdl = {
  name: string;
  discriminator: number[];
};

type RuntimeIdl = {
  address: string;
  accounts: RuntimeAccountIdl[];
};

export const runtimeIdl = hackNftIdlJson as unknown as RuntimeIdl;

export const PROGRAM_ID = new PublicKey(env.programId);
export const METADATA_PROGRAM_ID = new PublicKey(env.metadataProgramId);
export const COLLECTION_MINT = env.collectionMint
  ? new PublicKey(env.collectionMint)
  : null;

const idlProgramId = new PublicKey(runtimeIdl.address);
if (!idlProgramId.equals(PROGRAM_ID)) {
  throw new Error(
    `Configured PROGRAM_ID (${PROGRAM_ID.toBase58()}) does not match the bundled Anchor IDL (${idlProgramId.toBase58()}).`,
  );
}

const listingIdlAccount = runtimeIdl.accounts.find(
  (account) => account.name.toLowerCase() === 'listing',
);
if (!listingIdlAccount || listingIdlAccount.discriminator.length !== 8) {
  throw new Error('The bundled hack_nft IDL does not contain a valid Listing discriminator.');
}

export const LISTING_DISCRIMINATOR = Buffer.from(listingIdlAccount.discriminator);

const listingInstruction = (runtimeIdl as unknown as {
  instructions: Array<{ name: string; accounts: Array<{ name: string; address?: string }> }>;
}).instructions.find((instruction) => instruction.name === 'listing');
const metadataProgramAccount = listingInstruction?.accounts.find(
  (account) => account.name.toLowerCase() === 'metadata_program' || account.name.toLowerCase() === 'metadataprogram',
);
if (metadataProgramAccount?.address && !new PublicKey(metadataProgramAccount.address).equals(METADATA_PROGRAM_ID)) {
  throw new Error(
    `Configured METADATA_PROGRAM_ID (${METADATA_PROGRAM_ID.toBase58()}) does not match the bundled Anchor IDL (${metadataProgramAccount.address}).`,
  );
}
