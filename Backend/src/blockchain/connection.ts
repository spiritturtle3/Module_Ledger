import { Connection } from '@solana/web3.js';
import { env } from '../config/env.js';

export const solanaConnection = new Connection(env.solanaRpcUrl, {
  commitment: env.solanaCommitment,
  wsEndpoint: env.solanaWsUrl,
});
