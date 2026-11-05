"use client";

import { Circle, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { SOLANA_RPC_ENDPOINT } from "@/lib/config";
import {
  getLocalValidatorStatus,
  type LocalValidatorStatus,
} from "@/lib/solana";

const networkName = SOLANA_RPC_ENDPOINT.includes("devnet")
  ? "Solana Devnet RPC"
  : SOLANA_RPC_ENDPOINT.includes("mainnet")
    ? "Solana Mainnet RPC"
    : SOLANA_RPC_ENDPOINT.includes("127.0.0.1") ||
        SOLANA_RPC_ENDPOINT.includes("localhost")
      ? "Local validator"
      : "Solana RPC";

export function LocalValidatorBadge() {
  const [status, setStatus] = useState<LocalValidatorStatus | null>(null);

  useEffect(() => {
    let active = true;

    getLocalValidatorStatus().then((result) => {
      if (active) setStatus(result);
    });

    return () => {
      active = false;
    };
  }, []);

  const connected = status?.connected === true;

  const label = !status
    ? `Checking ${networkName}`
    : connected
      ? `${networkName} reachable`
      : `${networkName} unavailable`;

  return (
    <span
      className={`validator-badge ${connected ? "is-online" : ""}`}
      title={status?.error}
    >
      {connected ? <Radio size={13} /> : <Circle size={9} />}
      {label}
    </span>
  );
}