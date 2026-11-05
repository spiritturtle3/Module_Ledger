import type { Metadata } from "next";
import { MarketplaceListings } from "@/components/marketplace-listings";
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
        <MarketplaceListings />
      </div>
    </main>
  );
}
