'use client'

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { useMemo } from 'react'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CloverWalletAdapter,
  TorusWalletAdapter
} from '@solana/wallet-adapter-wallets'

// Default styles for wallet modal
import '@solana/wallet-adapter-react-ui/styles.css'

export default function WalletProviders({ children }: { children: React.ReactNode }) {
  // Use Devnet cluster
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => process.env.NEXT_PUBLIC_RPC_ENDPOINT || clusterApiUrl(network), [network])

  // Initialize supported wallets
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network }),
    new CloverWalletAdapter(),
    new TorusWalletAdapter()
  ], [network])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

