import { Compass, Search, SlidersHorizontal } from "lucide-react";
import type { Metadata } from "next";
import { IntegrationNotice } from "@/components/integration-notice";
import { LocalValidatorBadge } from "@/components/local-validator-badge";

export const metadata: Metadata = { title: "Marketplace" };

export default function MarketplacePage() {
  return (
    <main className="workspace-page">
      <div className="workspace-shell">
        <div className="page-heading-row">
          <div>
            <span className="eyebrow">DISCOVER</span>
            <h1>AI model marketplace</h1>
            <p>Explore models with clear metadata and creator provenance.</p>
          </div>
          <LocalValidatorBadge />
        </div>
        <IntegrationNotice />
        <div className="market-toolbar">
          <label className="search-field">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search models, frameworks, or tasks"
              aria-label="Search marketplace"
              disabled
            />
            <span>Search will be available when the marketplace program is connected</span>
          </label>
          <button type="button" className="button button-outline" disabled>
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>
        <div className="market-empty">
          <div className="empty-art">
            <div className="empty-orbit orbit-a" />
            <div className="empty-orbit orbit-b" />
            <Compass size={31} />
          </div>
          <span className="eyebrow">A verified catalog</span>
          <h2>Marketplace data is not connected</h2>
          <p>
            No listings are displayed because the repository does not include an IDL that matches
            the configured program ID. Once the correct contract details are available, listings
            will be read from the local validator and only vaults holding exactly one token will be
            shown as buyable.
          </p>
          <div className="empty-footnote">
            <span className="status-pulse" /> No sample listings are being shown
          </div>
        </div>
      </div>
    </main>
  );
}
