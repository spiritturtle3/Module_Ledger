# Backend Devnet Quick Start

## Requirements
- Node.js 22 or later
- npm
- Solana Devnet RPC access

## Installation

Navigate to the Backend directory:

    cd Backend
    npm ci

Configure environment variables using `.env.example`.
Never commit `.env` or expose API tokens.

## Solana Devnet Configuration

- Cluster: Devnet
- RPC: https://api.devnet.solana.com
- WebSocket: wss://api.devnet.solana.com
- Program ID: PROGRAM_ID environment variable
- Metadata Program: METADATA_PROGRAM_ID environment variable

Confirm the deployed Program ID with the Blockchain team.

## Development

    npm run dev

## Validation

    npm test
    npm run typecheck
    npm run build

## Health Checks

- GET /api/health
- GET /api/solana/health

The optional chain indexer requires MONGODB_URI.

## Security

- Never commit .env.
- Never expose Pinata JWT tokens.
- Never commit private keys.
