"use client";

import { useConnection, useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ExternalLink, LoaderCircle, RefreshCw, Search, ShoppingBag, Tag, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  delistOwnedNft,
  fetchActiveListings,
  inspectListingEligibility,
  type ListingEligibility,
  listVerifiedNft,
  parseListingPrice,
  purchaseListing,
  type ListingRow,
} from "@/lib/marketplace-client";
import { addressExplorerUrl, transactionExplorerUrl } from "@/lib/config";

function displaySol(lamports: bigint): string {
  const units = BigInt(LAMPORTS_PER_SOL);
  const whole = lamports / units;
  const fractional = (lamports % units).toString().padStart(9, "0").replace(/0+$/, "");
  return fractional ? `${whole.toString()}.${fractional}` : whole.toString();
}

export function MarketplaceListings() {
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const requestId = useRef(0);
  const [mintToSell, setMintToSell] = useState("");
  const [priceSol, setPriceSol] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<ListingEligibility | null>(null);
  const [checkingMint, setCheckingMint] = useState(false);
  const eligibilityRequest = useRef(0);

  // A creator can arrive directly from Dashboard or Publish with an NFT preselected.
  useEffect(() => {
    const requestedMint = new URLSearchParams(window.location.search).get("mint");
    if (requestedMint) setMintToSell(requestedMint);
  }, []);

  useEffect(() => {
    eligibilityRequest.current += 1;
    setEligibility(null);
  }, [publicKey]);
  const visibleListings = listings.filter((listing) => {
    const query = search.trim().toLowerCase();
    return !query || listing.mint.toLowerCase().includes(query) || listing.maker.toLowerCase().includes(query);
  });

  const refreshListings = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    try {
      const nextListings = await fetchActiveListings(connection);
      if (currentRequest === requestId.current) {
        setListings(nextListings);
        setMessage((previous) => previous?.startsWith("Could not load Devnet listings") ? null : previous);
      }
    } catch (error) {
      if (currentRequest === requestId.current) {
        setMessage(`Could not load Devnet listings: ${error instanceof Error ? error.message : "RPC unavailable."}`);
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    void refreshListings();
    return () => {
      requestId.current += 1;
    };
  }, [refreshListings]);

  async function handleCheckEligibility() {
    if (!connected || !publicKey) {
      setEligibility({ canList: false, message: "Connect the wallet that owns the NFT first." });
      return;
    }
    const currentRequest = ++eligibilityRequest.current;
    setCheckingMint(true);
    setEligibility(null);
    try {
      const result = await inspectListingEligibility(connection, publicKey, mintToSell);
      if (currentRequest === eligibilityRequest.current) setEligibility(result);
    } catch (error) {
      if (currentRequest === eligibilityRequest.current) {
        setEligibility({ canList: false, message: error instanceof Error ? error.message : "NFT check failed." });
      }
    } finally {
      if (currentRequest === eligibilityRequest.current) setCheckingMint(false);
    }
  }

  async function runAction(action: () => Promise<string>, successMessage: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setMessage("Waiting for wallet approval and Devnet confirmation…");
    setSignature(null);
    try {
      const txSignature = await action();
      setSignature(txSignature);
      setMessage(successMessage);
      setEligibility(null);
      toast.success(successMessage);
      await refreshListings();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Transaction failed.";
      setMessage(detail);
      toast.error(detail);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function handleList() {
    if (!connected || !anchorWallet) {
      setMessage("Connect a wallet to list an NFT.");
      return;
    }
    let price: bigint;
    try {
      price = parseListingPrice(priceSol);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enter a valid SOL price.");
      return;
    }
    void runAction(
      () => listVerifiedNft(connection, anchorWallet, mintToSell, price),
      "NFT listed and confirmed on Devnet.",
    );
  }

  function handleBuy(listing: ListingRow) {
    if (!connected || !anchorWallet) {
      setMessage("Connect a wallet to purchase an NFT.");
      return;
    }
    if (listing.maker === publicKey?.toBase58()) {
      setMessage("You cannot purchase your own listing.");
      return;
    }
    void runAction(
      () => purchaseListing(connection, anchorWallet, listing),
      "Purchase confirmed on Devnet.",
    );
  }

  function handleDelist(listing: ListingRow) {
    if (!connected || !anchorWallet || listing.maker !== publicKey?.toBase58()) {
      setMessage("Only the connected seller can delist this NFT.");
      return;
    }
    void runAction(
      () => delistOwnedNft(connection, anchorWallet, listing.mint),
      "NFT delisted and returned to your wallet.",
    );
  }

  return (
    <section className="marketplace-transactions" aria-label="Devnet marketplace listings">
      <div className="market-actions-bar">
        <div>
          <span className="eyebrow">SOLANA DEVNET</span>
          <p>Listings are read from the marketplace program. Only vaults holding one NFT are shown.</p>
        </div>
        <button
          type="button"
          className="button button-outline"
          onClick={() => void refreshListings()}
          disabled={loading || busy}
        >
          {loading ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      {message && (
        <div className="transaction-message" role="status" aria-live="polite">
          <span>{message}</span>
          {signature && (
            <a href={transactionExplorerUrl(signature)} target="_blank" rel="noreferrer">
              View transaction <ExternalLink size={14} />
            </a>
          )}
        </div>
      )}

      {listings.length > 0 && (
        <label className="search-field listing-search">
          <Search size={17} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by NFT mint or seller"
            aria-label="Search listings by mint or seller"
          />
        </label>
      )}

      {loading && listings.length === 0 ? (
        <div className="market-empty"><LoaderCircle className="spin" /> Loading Devnet listings…</div>
      ) : message?.startsWith("Could not load Devnet listings") && listings.length === 0 ? (
        <div className="market-empty error-text"><h2>Devnet listings are temporarily unavailable</h2><p>{message}</p></div>
      ) : listings.length === 0 ? (
        <div className="market-empty">
          <div className="empty-art"><ShoppingBag size={31} /></div>
          <span className="eyebrow">ON-CHAIN CATALOG</span>
          <h2>No buyable listings found</h2>
          <p>Only active listings whose vault contains exactly one zero-decimal token appear here.</p>
        </div>
      ) : visibleListings.length === 0 ? (
        <div className="market-empty"><h2>No matching listings</h2><p>Try another mint or seller address.</p></div>
      ) : (
        <div className="listing-grid">
          {visibleListings.map((listing) => {
            const ownListing = listing.maker === publicKey?.toBase58();
            return (
              <article className="listing-card" key={listing.address}>
                <div className="listing-card-top">
                  <span className="listing-icon"><Tag size={18} /></span>
                  <strong>{displaySol(listing.priceLamports)} SOL</strong>
                </div>
                <dl>
                  <div><dt>NFT mint</dt><dd><a href={addressExplorerUrl(listing.mint)} target="_blank" rel="noreferrer">{listing.mint.slice(0, 7)}…{listing.mint.slice(-5)} <ExternalLink size={12} /></a></dd></div>
                  <div><dt>Seller</dt><dd>{ownListing ? "You" : `${listing.maker.slice(0, 7)}…${listing.maker.slice(-5)}`}</dd></div>
                </dl>
                {ownListing ? (
                  <button type="button" className="button button-outline" onClick={() => handleDelist(listing)} disabled={busy}>
                    {busy ? <LoaderCircle className="spin" size={16} /> : <Undo2 size={16} />} Delist
                  </button>
                ) : (
                  <button type="button" className="button button-primary" onClick={() => handleBuy(listing)} disabled={busy || !connected}>
                    {busy ? <LoaderCircle className="spin" size={16} /> : <ShoppingBag size={16} />} Buy NFT
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      <form
        className="list-nft-panel"
        onSubmit={(event) => {
          event.preventDefault();
          handleList();
        }}
      >
        <div>
          <span className="eyebrow">SELL A MODEL NFT</span>
          <h2>Create a listing</h2>
          <p>Only a wallet-owned NFT verified by the current ModuLedger collection authority can be listed. Newly minted NFTs start unverified.</p>
        </div>
        <label className="field">
          NFT mint
          <input
            value={mintToSell}
            onChange={(event) => {
              eligibilityRequest.current += 1;
              setMintToSell(event.target.value);
              setEligibility(null);
              setCheckingMint(false);
            }}
            disabled={busy}
            placeholder="Paste NFT mint, or select from Dashboard"
            aria-label="NFT mint address"
            required
          />
        </label>
        <label className="field">
          Price in SOL
          <input
            value={priceSol}
            onChange={(event) => setPriceSol(event.target.value)}
            disabled={busy}
            inputMode="decimal"
            placeholder="0.05"
            required
          />
          <small>Price must exceed the on-chain fee of 1 lamport.</small>
        </label>
        <button
          type="button"
          className="button button-outline"
          onClick={() => void handleCheckEligibility()}
          disabled={busy || checkingMint || !connected || !mintToSell.trim()}
        >
          {checkingMint ? <LoaderCircle className="spin" size={16} /> : <Search size={16} />}
          Check NFT
        </button>
        <button type="submit" className="button button-primary" disabled={busy || !connected || !mintToSell.trim() || !priceSol.trim() || eligibility?.canList === false}>
          {busy ? <LoaderCircle className="spin" size={16} /> : <Tag size={16} />} List NFT
        </button>
        {eligibility && (
          <p className={`listing-check-result ${eligibility.canList ? "listing-check-ready" : "error-text"}`} role="status" aria-live="polite">
            {eligibility.message}
          </p>
        )}
        {!connected && <p className="form-hint">Connect a wallet to list, buy, or delist NFTs.</p>}
      </form>
    </section>
  );
}
