import { AlertTriangle, ShieldCheck } from "lucide-react";
import { SOLANA_PROGRAM_ID } from "@/lib/config";

export function IntegrationNotice({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`integration-notice ${compact ? "compact" : ""}`}>
      <div className="notice-icon">
        <AlertTriangle size={17} />
      </div>
      <div>
        <strong>On-chain marketplace actions are not connected yet</strong>
        <p>
          The provided program ID is configured as <code>{SOLANA_PROGRAM_ID}</code>, but the
          reference IDL targets a different program. Listing, delisting, purchase, collection
          verification, and minting stay disabled until the matching IDL and collection
          configuration are available.
        </p>
      </div>
      <span className="notice-shield">
        <ShieldCheck size={17} /> No simulated transactions
      </span>
    </aside>
  );
}
