"use client";

import { PublicKey } from "@solana/web3.js";
import { AlertTriangle, CheckCircle2, Clipboard, LoaderCircle, ShieldCheck } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { IntegrationNotice } from "@/components/integration-notice";

const STORAGE_KEY = "moduledger:collection-mint";

export default function CollectionsPage() {
  const [mint, setMint] = useState("");
  const [savedMint, setSavedMint] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) ?? "";
    setMint(saved);
    setSavedMint(saved);
  }, []);

  function saveCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const collectionAddress = new PublicKey(mint.trim()).toBase58();
      window.localStorage.setItem(STORAGE_KEY, collectionAddress);
      setMint(collectionAddress);
      setSavedMint(collectionAddress);
      toast.success("Collection mint saved in this browser.");
    } catch {
      setError("Enter a valid Solana public key.");
    }
  }

  function clearCollection() {
    window.localStorage.removeItem(STORAGE_KEY);
    setMint("");
    setSavedMint("");
    setError("");
  }

  return (
    <main className="workspace-page">
      <div className="workspace-shell collection-shell">
        <div className="page-heading-row">
          <div>
            <span className="eyebrow">COLLECTIONS</span>
            <h1>Collection manager</h1>
            <p>Configure the collection mint used by your creator workspace.</p>
          </div>
        </div>
        <IntegrationNotice compact />
        <div className="collection-grid">
          <section className="form-panel collection-config-panel">
            <div className="form-panel-head">
              <span className="form-index">01</span>
              <div>
                <h2>Collection mint</h2>
                <p>Enter a collection address provided by your Solana setup.</p>
              </div>
            </div>
            <form onSubmit={saveCollection} className="collection-form">
              <label className="field">
                Collection mint address
                <input
                  value={mint}
                  onChange={(event) => setMint(event.target.value)}
                  placeholder="Paste a Solana public key"
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              {error && <p className="collection-error">{error}</p>}
              <div className="collection-actions">
                <button className="button button-primary" type="submit">
                  Save collection address
                </button>
                {savedMint && (
                  <button className="button button-outline" type="button" onClick={clearCollection}>
                    Clear
                  </button>
                )}
              </div>
            </form>
            {savedMint && (
              <div className="configured-collection">
                <span className="configured-check">
                  <CheckCircle2 size={17} />
                </span>
                <div>
                  <strong>Address saved in this browser</strong>
                  <code>{savedMint}</code>
                </div>
                <button
                  type="button"
                  className="copy-mint-button"
                  aria-label="Copy collection mint address"
                  onClick={() => {
                    void navigator.clipboard.writeText(savedMint);
                    toast.success("Collection mint copied.");
                  }}
                >
                  <Clipboard size={15} />
                </button>
              </div>
            )}
            <p className="collection-footnote">
              This only stores the address locally. The app has not verified collection metadata or
              authority on-chain.
            </p>
          </section>
          <aside className="collection-status-card">
            <div className="collection-status-icon">
              <ShieldCheck size={22} />
            </div>
            <span className="eyebrow">VERIFICATION STATUS</span>
            <h2>On-chain verification unavailable</h2>
            <p>
              Collection verification and NFT minting depend on the marketplace program’s
              instruction accounts and the authoritative collection configuration. The only bundled
              IDL points to a different program.
            </p>
            <div className="blocker-row">
              <AlertTriangle size={15} />
              <span>Waiting for an IDL matching the configured program ID</span>
            </div>
            <div className="blocker-row">
              <LoaderCircle size={15} />
              <span>No verification transaction has been sent</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
