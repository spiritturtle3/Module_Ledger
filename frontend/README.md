# ModuLedger frontend

The ModuLedger frontend is a decentralized AI model marketplace built on Solana. It combines model metadata preparation, IPFS content references, NFT minting, collections, and marketplace ownership workflows.

## Features

- **Connect Wallet**: Seamlessly connect your Solana wallet
- **Discover AI models**: View model NFTs listed in the marketplace
- **Create model NFTs**: Prepare metadata and mint AI model ownership records
- **Create collections**: Organize related model NFTs
- **List/Delist**: List models for sale or remove them from the marketplace
- **Buy/Sell**: Purchase listed model NFTs with a connected Solana wallet

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **Web3**: Solana Web3.js, Anchor, Metaplex SDK (UMI)
- **State Management**: TanStack Query (React Query)
- **UI Components**: Shadcn UI

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `src/components` - React components
- `src/hooks` - Custom React hooks for Solana integration
- `src/app` - Next.js app router pages
- `src/lib` - Utility functions and shared logic

## Solana Program

The frontend connects to the existing Solana program with the following ID:
`711gctwBN1aGqzRhQbDD3qiescrzg4m9Zjj1ZGndLDis`

The program supports the following instructions:
- `initialize` - Initialize a new marketplace
- `listing` - List an NFT for sale
- `delist` - Remove an NFT from sale
- `purchase` - Buy an NFT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
