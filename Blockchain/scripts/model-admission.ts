import { publicKey } from "@metaplex-foundation/umi";

export const APPROVED_MODELS_ENV = "MODU_LEDGER_APPROVED_MODELS";

export interface ApprovedModel {
  mint: string;
  creatorWallet: string;
}

export interface ModelAdmissionInput {
  suppliedMint: string;
  metadataMint: string;
  verifiedCreatorWallets: readonly string[];
  approvals: readonly ApprovedModel[];
}

export type VerificationAction = "already-verified" | "dry-run" | "submit";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function loadApprovedModels(raw: string | undefined): ApprovedModel[] {
  if (!raw?.trim()) {
    throw new Error(
      "Admission rejected: no NFT approval is configured. Set " +
        APPROVED_MODELS_ENV +
        " to a JSON array of approved mint and creatorWallet pairs."
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "Invalid " +
        APPROVED_MODELS_ENV +
        ": expected a JSON array of approved mint and creatorWallet pairs."
    );
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(
      "Admission rejected: " +
        APPROVED_MODELS_ENV +
        " must contain at least one approved mint and creatorWallet pair."
    );
  }

  const seenMints = new Set<string>();
  return parsed.map((entry: unknown, index: number) => {
    if (
      !isRecord(entry) ||
      typeof entry.mint !== "string" ||
      typeof entry.creatorWallet !== "string"
    ) {
      throw new Error(
        "Invalid " +
          APPROVED_MODELS_ENV +
          " entry " +
          (index + 1) +
          ": each entry requires string mint and creatorWallet fields."
      );
    }

    let mint: string;
    let creatorWallet: string;
    try {
      mint = publicKey(entry.mint).toString();
      creatorWallet = publicKey(entry.creatorWallet).toString();
    } catch {
      throw new Error(
        "Invalid " +
          APPROVED_MODELS_ENV +
          " entry " +
          (index + 1) +
          ": mint and creatorWallet must be valid Solana addresses."
      );
    }

    if (seenMints.has(mint)) {
      throw new Error(
        "Invalid " +
          APPROVED_MODELS_ENV +
          ": duplicate approval for NFT mint " +
          mint +
          "."
      );
    }
    seenMints.add(mint);

    return { mint, creatorWallet };
  });
}

export function getModelVerificationAction(
  input: ModelAdmissionInput,
  alreadyVerified: boolean,
  dryRun: boolean
): VerificationAction {
  if (input.metadataMint !== input.suppliedMint) {
    throw new Error(
      "Admission rejected: fetched metadata belongs to mint " +
        input.metadataMint +
        ", not supplied NFT mint " +
        input.suppliedMint +
        "."
    );
  }

  const approval = input.approvals.find(
    (candidate) => candidate.mint === input.suppliedMint
  );
  if (!approval) {
    throw new Error(
      "Admission rejected: NFT mint " +
        input.suppliedMint +
        " is not explicitly approved in " +
        APPROVED_MODELS_ENV +
        "."
    );
  }

  if (!input.verifiedCreatorWallets.includes(approval.creatorWallet)) {
    throw new Error(
      "Admission rejected: approved creator wallet " +
        approval.creatorWallet +
        " is not a verified creator on NFT mint " +
        input.suppliedMint +
        "."
    );
  }

  if (alreadyVerified) return "already-verified";
  if (dryRun) return "dry-run";
  return "submit";
}
