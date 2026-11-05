
# ModuLedger — End-to-End Test Plan

## Test Environment

- Network: Solana Devnet
- Frontend URL: Pending
- Backend URL: Pending
- Program ID: Pending
- Creator Wallet: Pending
- Buyer Wallet: Pending

## E2E-01: Model Publishing

Steps:
1. Connect creator wallet.
2. Upload sample model ZIP.
3. Fill model metadata.
4. Publish model.
5. Record package CID.
6. Record manifest CID.

Expected:
- Model package is available on IPFS.
- Manifest contains correct package CID.
- Manifest metadata matches creator input.

Status: Not Run

## E2E-02: NFT Minting

Steps:
1. Publish a model release.
2. Approve mint transaction.
3. Record NFT mint address.
4. Inspect NFT metadata.

Expected:
- NFT exists on Solana Devnet.
- Metadata references the correct model manifest.

Status: Not Run

## E2E-03: Marketplace Listing

Steps:
1. Connect creator wallet.
2. Select minted NFT.
3. Set listing price.
4. Approve listing transaction.
5. Inspect listing and vault accounts.

Expected:
- Listing account exists.
- NFT is held in the expected escrow vault.
- Seller, mint and price are correct.

Status: Not Run

## E2E-04: NFT Purchase

Steps:
1. Connect buyer wallet.
2. Open listed model.
3. Approve purchase.
4. Record transaction signature.
5. Inspect resulting accounts and balances.

Expected:
- Buyer receives NFT.
- Seller receives sale proceeds.
- Treasury receives marketplace fee.
- Listing is closed.
- Transaction succeeds on Solana Devnet.

Status: Not Run

## E2E-05: Security Testing

Required negative cases:
- Wrong seller rejected.
- Wrong NFT mint rejected.
- Invalid marketplace fee rejected.
- Duplicate listing rejected.
- Unauthorized delisting rejected.

Status: Not Run

## Evidence Required

For every executed test, record:
- Test ID
- Date and time
- Expected result
- Actual result
- Pass/Fail
- Transaction signature or API response
- Relevant logs or screenshots
- Assigned bug ID if failed
