# ModuLedger frontend

Next.js App Router frontend for the ModuLedger decentralized AI model marketplace.

## Requirements

- Node.js 22 LTS (Node 24 also satisfies the declared runtime range)
- npm 10 or newer
- The Express backend at `http://localhost:5000/api` for model, image, and metadata uploads
- Solana Devnet at `https://api.devnet.solana.com` for wallet connectivity and on-chain reads/writes

The frontend uses the workspace IDL at `Blockchain/idl/hack_nft.json`, which matches the Anchor source program ID. The application is configured for Solana Devnet, program `AuR4iqjMWbEmHTpKHyKcNbT3ggSAWrcZdudwCcjPuEBT`, and canonical collection `2nJPccGnaZjjtRchVpJWH5bo4HdZzUk964UfQPHKDDyH`. Wallet approval is required to mint, list, buy, or delist. Newly minted NFTs are unverified collection members until the collection authority verifies them. Listing prices must exceed the marketplace fee; the deployed program charges one lamport per purchase.

## Setup

```bash
cp .env.example .env.local
npm ci
npm run dev
```

The upload flow posts files as multipart field `file` to `/ipfs/upload-file` and posts the backend's validated metadata schema to `/ipfs/upload-metadata`. The browser never talks to Pinata.

## Commands

```bash
npm run lint
npm run format:check
npm run typecheck
npm run build
```
