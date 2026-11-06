"use client";

import { CloverWalletAdapter } from "@solana/wallet-adapter-clover";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useMemo, useState } from "react";
import { Toaster } from "sonner";
import { SolanaClientsProvider } from "@/components/solana-clients-provider";
import { SOLANA_RPC_ENDPOINT } from "@/lib/config";

import "@solana/wallet-adapter-react-ui/styles.css";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const wallets = useMemo(
    // Phantom is discovered via Wallet Standard. Registering it again can select a stale adapter.
    () => [new SolflareWalletAdapter(), new CloverWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <SolanaClientsProvider>
            <QueryClientProvider client={queryClient}>
              {children}
              <Toaster theme="dark" position="bottom-right" />
            </QueryClientProvider>
          </SolanaClientsProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
