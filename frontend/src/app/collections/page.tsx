import { ExternalLink, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { addressExplorerUrl, COLLECTION_MINT, SOLANA_CLUSTER } from "@/lib/config";

export const metadata: Metadata = { title: "Collection" };

export default function CollectionsPage() {
  return (
    <main className="workspace-page">
      <div className="workspace-shell collection-shell">
        <div className="page-heading-row">
          <div>
            <span className="eyebrow">COLLECTIONS</span>
            <h1>Canonical model collection</h1>
            <p>New model NFTs are minted into the collection configured for ModuLedger Devnet.</p>
          </div>
          <span className="validator-badge is-online">Solana {SOLANA_CLUSTER}</span>
        </div>
        <section className="form-panel collection-config-panel">
          <div className="form-panel-head">
            <span className="form-index">01</span>
            <div>
              <h2>Collection mint</h2>
              <p>The collection address is fixed by the application’s Devnet configuration.</p>
            </div>
          </div>
          <div className="configured-collection">
            <span className="configured-check"><ShieldCheck size={17} /></span>
            <div>
              <strong>Canonical collection</strong>
              <code>{COLLECTION_MINT}</code>
            </div>
            <a
              className="copy-mint-button"
              aria-label="View canonical collection on Solana Explorer"
              href={addressExplorerUrl(COLLECTION_MINT)}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={15} />
            </a>
          </div>
          <p className="collection-footnote">
            NFTs are minted with this collection reference and verified=false. Only the configured
            collection authority can complete Metaplex collection verification.
          </p>
        </section>
      </div>
    </main>
  );
}
