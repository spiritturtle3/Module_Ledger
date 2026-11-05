# ModuLedger — QA Test Plan

## Frontend
- [ ] Homepage loads
- [ ] Wallet connects
- [ ] Marketplace displays models
- [ ] Publish Model form works
- [ ] Purchase button works

## Backend
- [ ] Backend health endpoint responds
- [ ] Valid ZIP uploads
- [ ] Invalid file is rejected
- [ ] Manifest is generated
- [ ] IPFS package can be retrieved
- [ ] SHA-256 checksum matches

## Blockchain
- [ ] Marketplace initializes
- [ ] NFT lists and enters escrow
- [ ] NFT delists successfully
- [ ] Purchase settles correctly
- [ ] Seller receives payment
- [ ] Treasury receives fee
- [ ] Buyer receives NFT

## Security
- [ ] Wrong seller rejected
- [ ] Wrong NFT mint rejected
- [ ] Invalid fee rejected
- [ ] Duplicate listing rejected

## Integration
- [ ] Complete creator-to-buyer workflow passes
- [ ] Solana Explorer transaction verified