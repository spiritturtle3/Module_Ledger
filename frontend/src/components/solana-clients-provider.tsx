"use client";

import { AnchorProvider } from "@anchor-lang/core";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import type { Umi } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createContext, type ReactNode, useContext, useMemo } from "react";

interface SolanaClients {
  anchorProvider: AnchorProvider | null;
  umi: Umi | null;
}

const SolanaClientsContext = createContext<SolanaClients | null>(null);

export function SolanaClientsProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const { wallet, connected } = useWallet();

  const anchorProvider = useMemo(
    () =>
      anchorWallet
        ? new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions())
        : null,
    [anchorWallet, connection],
  );

  const umi = useMemo(() => {
    const adapter = wallet?.adapter;
    if (!connected || !adapter) return null;

    const client = createUmi(connection.rpcEndpoint)
      .use(mplTokenMetadata())
      .use(walletAdapterIdentity(adapter));

    if (typeof client.identity.signTransaction !== "function") {
      throw new Error("The connected wallet did not provide a Umi transaction signer.");
    }
    return client;
  }, [connected, connection.rpcEndpoint, wallet]);

  const value = useMemo(() => ({ anchorProvider, umi }), [anchorProvider, umi]);

  return <SolanaClientsContext.Provider value={value}>{children}</SolanaClientsContext.Provider>;
}

export function useSolanaClients(): SolanaClients {
  const clients = useContext(SolanaClientsContext);
  if (!clients) throw new Error("useSolanaClients must be used inside SolanaClientsProvider.");
  return clients;
}
