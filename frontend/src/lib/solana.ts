import { SOLANA_PROGRAM_ID, SOLANA_RPC_ENDPOINT } from "@/lib/config";

export const configuredProgramId = SOLANA_PROGRAM_ID;

export interface LocalValidatorStatus {
  connected: boolean;
  version?: string;
  error?: string;
}

export async function getLocalValidatorStatus(): Promise<LocalValidatorStatus> {
  try {
    const version = await callRpc<{ "solana-core": string }>("getVersion", []);
    return { connected: true, version: version["solana-core"] };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "RPC request failed",
    };
  }
}

interface ParsedTokenAccounts {
  value: Array<{
    account: {
      data: {
        parsed: {
          info: {
            mint: string;
            tokenAmount: { amount: string; decimals: number };
          };
        };
      };
    };
  }>;
}

async function callRpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(SOLANA_RPC_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "moduledger", method, params }),
  });
  if (!response.ok) throw new Error(`Local validator request failed (${response.status}).`);
  const body = (await response.json()) as { result?: T; error?: { message?: string } };
  if (body.error) throw new Error(body.error.message ?? "Local validator RPC error.");
  if (!body.result) throw new Error("Local validator returned an empty result.");
  return body.result;
}

export async function getOwnedNftMints(owner: string): Promise<string[]> {
  const accounts = await callRpc<ParsedTokenAccounts>("getTokenAccountsByOwner", [
    owner,
    { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    { encoding: "jsonParsed", commitment: "confirmed" },
  ]);

  return accounts.value.flatMap(({ account }) => {
    const parsed = account.data.parsed.info;
    const amount = parsed.tokenAmount;
    return amount.amount === "1" && amount.decimals === 0 ? [parsed.mint as string] : [];
  });
}
