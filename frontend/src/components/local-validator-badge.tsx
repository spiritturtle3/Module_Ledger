"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { Circle, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import {
  addressExplorerUrl,
  SOLANA_PROGRAM_ID,
} from "@/lib/config";

interface RpcStatus {
  connected: boolean;
  version?: string;
  error?: string;
}

export function LocalValidatorBadge() {
  const { connection } = useConnection();

  const [status, setStatus] = useState<RpcStatus | null>(null);

  const endpoint = connection.rpcEndpoint;

  const networkName = endpoint.includes("devnet")
    ? "Solana Devnet RPC"
    : endpoint.includes("mainnet")
      ? "Solana Mainnet RPC"
      : endpoint.includes("127.0.0.1") ||
          endpoint.includes("localhost")
        ? "Local validator"
        : "Solana RPC";

  useEffect(() => {
    let active = true;

    connection
      .getVersion()
      .then((version) => {
        if (active) {
          setStatus({
            connected: true,
            version: version["solana-core"],
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setStatus({
            connected: false,
            error:
              error instanceof Error
                ? error.message
                : "Solana RPC request failed",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [connection]);

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

      <span>{label}</span>

      <a
        href={addressExplorerUrl(SOLANA_PROGRAM_ID)}
        target="_blank"
        rel="noopener noreferrer"
        title="View ModuLedger program on Solana Explorer"
      >
        View program
      </a>
    </span>
  );
}