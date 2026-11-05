# ModuLedger frontend

Next.js App Router frontend for the ModuLedger decentralized AI model marketplace.

## Requirements

- Node.js 22 LTS (Node 24 also satisfies the declared runtime range)
- npm 10 or newer
- The Express backend at `http://localhost:5000/api` for model, image, and metadata uploads
- A Solana local validator at `http://127.0.0.1:8899` for wallet connectivity

The Solana program ID is configured as `AuR4iqjMWbEmHTpKHyKcNbT3ggSAWrcZdudwCcjPuEBT`. The reference ZIP's bundled IDL instead targets `711gctwBN1aGqzRhQbDD3qiescrzg4m9Zjj1ZGndLDis`; it is not used. Program instructions, collection verification, marketplace queries, listing, delisting, and purchasing remain unavailable until a matching authoritative IDL and collection configuration are provided. Anchor and Metaplex minting code are intentionally not wired to the stale IDL; those clients should be added with that integration milestone.

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
