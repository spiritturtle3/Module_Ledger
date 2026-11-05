import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import hackNftIdlJson from './idl/hack_nft.json';
import type { HackNft } from './types/hack_nft.js';
import { solanaConnection } from './connection.js';
import { env } from '../config/env.js';

/**
 * This provider exists only to support Anchor's account decoders/read methods.
 * It cannot sign. User and admin transactions must be signed by their own wallets.
 */
const readOnlyWallet = {
  publicKey: new PublicKey('11111111111111111111111111111111'),
  signTransaction: async (): Promise<never> => {
    throw new Error('This Backend Anchor provider is read-only.');
  },
  signAllTransactions: async (): Promise<never> => {
    throw new Error('This Backend Anchor provider is read-only.');
  },
};

export const anchorProvider = new AnchorProvider(
  solanaConnection,
  readOnlyWallet as never,
  {
    commitment: env.solanaCommitment,
    preflightCommitment: env.solanaCommitment,
  },
);

export const hackNftProgram = new Program<HackNft>(
  hackNftIdlJson as unknown as HackNft,
  anchorProvider,
);
