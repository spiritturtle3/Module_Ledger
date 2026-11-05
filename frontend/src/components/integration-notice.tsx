import { AlertTriangle, ShieldCheck } from "lucide-react";
import { COLLECTION_MINT, SOLANA_PROGRAM_ID, SOLANA_RPC_ENDPOINT } from "@/lib/config";

export function IntegrationNotice({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`integration-notice ${compact ? "compact" : ""}`}>
      <div className="notice-icon">
        <AlertTriangle size={17} />
      </div>
      <div>
        <strong>ModuLedger transactions are configured for Solana Devnet</strong>
        <p>
          The app uses <code>{SOLANA_RPC_ENDPOINT}</code>, program <code>{SOLANA_PROGRAM_ID}</code>,
          and canonical collection <code>{COLLECTION_MINT}</code>. Wallet approval is required for
          every transaction; collection verification remains an authority-controlled step.
        </p>
      </div>
      <span className="notice-shield">
        <ShieldCheck size={17} /> No simulated transactions
      </span>
    </aside>
  );
}
