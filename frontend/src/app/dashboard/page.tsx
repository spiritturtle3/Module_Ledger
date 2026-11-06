"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Coins, Layers3, RefreshCw, WalletCards } from "lucide-react";
import Link from "next/link";
import { IntegrationNotice } from "@/components/integration-notice";
import { getOwnedNftMints } from "@/lib/solana";
import { fetchActiveListings } from "@/lib/marketplace-client";
import { BUYER_REWARD_BASE_UNITS, REWARD_TOKEN_DECIMALS } from "@/types/blockchain";

export default function DashboardPage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const listingsQuery = useQuery({
    queryKey: ["marketplace-active-listings", connection.rpcEndpoint],
    queryFn: () => fetchActiveListings(connection),
    retry: false,
    staleTime: 30_000,
  });
  const ownedQuery = useQuery({
    queryKey: ["owned-nft-mints", publicKey?.toBase58()],
    queryFn: () => (publicKey ? getOwnedNftMints(publicKey.toBase58()) : Promise.resolve([])),
    enabled: connected && Boolean(publicKey),
    retry: false,
  });

  return (
    <main className="workspace-page">
      <div className="workspace-shell">
        <div className="page-heading-row">
          <div>
            <span className="eyebrow">YOUR WORKSPACE</span>
            <h1>Creator dashboard</h1>
            <p>See your wallet-owned NFT mints and track marketplace readiness.</p>
          </div>
        </div>
        <IntegrationNotice compact />
        <div className="stats-grid">
          <article className="stat-card">
            <span className="stat-icon">
              <Layers3 size={18} />
            </span>
            <span className="stat-label">Owned NFT mints</span>
            <strong>
              {connected
                ? ownedQuery.isLoading
                  ? "…"
                  : ownedQuery.isError
                    ? "—"
                    : (ownedQuery.data?.length ?? 0)
                : "—"}
            </strong>
            <small>{connected ? "Read from Solana Devnet" : "Connect a wallet to load"}</small>
          </article>
          <article className="stat-card">
            <span className="stat-icon">
              <Coins size={18} />
            </span>
            <span className="stat-label">Reward token</span>
            <strong>
              {(Number(BUYER_REWARD_BASE_UNITS) / 10 ** REWARD_TOKEN_DECIMALS).toFixed(
                REWARD_TOKEN_DECIMALS,
              )}
            </strong>
            <small>One base unit per completed purchase · 6 decimals</small>
          </article>
          <article className="stat-card">
            <span className="stat-icon">
              <WalletCards size={18} />
            </span>
            <span className="stat-label">Marketplace listings</span>
            <strong>{listingsQuery.isLoading ? "…" : listingsQuery.isError ? "—" : (listingsQuery.data?.length ?? 0)}</strong>
            <small>{listingsQuery.isError ? "Listing RPC unavailable; try Marketplace" : "Active verified listings on Devnet"}</small>
          </article>
        </div>
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Wallet-owned NFT mints</h2>
              <p>Token accounts holding exactly one token with zero decimals.</p>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Refresh owned NFTs"
              onClick={() => void ownedQuery.refetch()}
              disabled={!connected || ownedQuery.isFetching}
            >
              <RefreshCw size={17} className={ownedQuery.isFetching ? "spin" : ""} />
            </button>
          </div>
          {!connected ? (
            <div className="inline-empty">
              <span className="empty-small-icon">
                <WalletCards size={19} />
              </span>
              <strong>Connect your wallet</strong>
              <p>
                Your actual NFT token accounts will appear here after connecting to Solana
                Devnet.
              </p>
            </div>
          ) : ownedQuery.isLoading ? (
            <div className="inline-empty">Reading token accounts from Solana Devnet…</div>
          ) : ownedQuery.isError ? (
            <div className="inline-empty error-text">
              Could not load wallet assets: {(ownedQuery.error as Error).message}
            </div>
          ) : ownedQuery.data?.length ? (
            <ul className="mint-list">
              {ownedQuery.data.map((mint) => (
                <li key={mint}>
                  <span className="mint-symbol">◎</span>
                  <code>{mint}</code>
                  <span className="mint-balance">1 NFT</span>
                  <Link className="text-link" href={`/marketplace?mint=${encodeURIComponent(mint)}`}>
                    Check / sell <ArrowRight size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="inline-empty">
              <span className="empty-small-icon">
                <Layers3 size={19} />
              </span>
              <strong>No NFTs found in this wallet</strong>
              <p>The connected wallet has no token accounts matching the NFT criteria.</p>
              <Link className="text-link" href="/publish">
                Prepare a model record <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
