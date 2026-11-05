import test from 'node:test';
import assert from 'node:assert/strict';
import { PublicKey } from '@solana/web3.js';
import {
  deriveListingPda,
  deriveMarketplacePda,
  deriveRewardsMintPda,
  deriveTreasuryPda,
} from '../src/blockchain/pda.js';
import { PROGRAM_ID } from '../src/blockchain/constants.js';

test('marketplace, rewards and treasury PDAs are deterministic', () => {
  const name = 'moduledger-test-market';
  const [marketplace] = deriveMarketplacePda(name);
  const [marketplaceAgain] = deriveMarketplacePda(name);
  const [rewards] = deriveRewardsMintPda(marketplace);
  const [treasury] = deriveTreasuryPda(marketplace);

  assert.equal(marketplace.toBase58(), marketplaceAgain.toBase58());
  assert.notEqual(rewards.toBase58(), treasury.toBase58());
});

test('listing PDA uses marketplace followed by mint, with no string prefix', () => {
  const [marketplace] = deriveMarketplacePda('moduledger-test-market');
  const mint = new PublicKey('So11111111111111111111111111111111111111112');

  const [actual] = deriveListingPda(marketplace, mint);
  const [expected] = PublicKey.findProgramAddressSync(
    [marketplace.toBuffer(), mint.toBuffer()],
    PROGRAM_ID,
  );

  assert.equal(actual.toBase58(), expected.toBase58());
});

test('marketplace name over 32 UTF-8 bytes is rejected', () => {
  assert.throws(() => deriveMarketplacePda('x'.repeat(33)), /32-byte limit/);
});
