"use client";

import { Circle, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { getLocalValidatorStatus, type LocalValidatorStatus } from "@/lib/solana";

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
    ? "Checking local validator"
    : connected
      ? "Local validator online"
      : "Local validator offline";

  return (
    <span className={`validator-badge ${connected ? "is-online" : ""}`} title={status?.error}>
      {connected ? <Radio size={13} /> : <Circle size={9} />}
      {label}
    </span>
  );
}
