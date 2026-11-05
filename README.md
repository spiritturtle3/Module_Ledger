# ModuLedger

ModuLedger is a decentralized AI model marketplace built around Solana-based ownership and model metadata.

## Repository structure

- [`frontend/`](./frontend/) contains the Next.js application, wallet connection, model/NFT workflows, and marketplace UI.
- [`Backend/`](./Backend/) contains the Express API, IPFS upload routes, validation, and Pinata service integration.
- [`docs/`](./docs/) contains integration and QA documentation.
- [`qa/`](./qa/) contains backend API, validation, integrity, and smoke-test tooling.
- [`.github/workflows/`](./.github/workflows/) contains repository QA automation.

The frontend currently provides marketplace discovery, wallet connection, model/NFT draft workflows, collections, and marketplace transaction integration. Backend API, IPFS storage, marketplace transactions, model downloads, collection management, and on-chain minting should be verified against their respective service and blockchain environments before being described as production-ready.
