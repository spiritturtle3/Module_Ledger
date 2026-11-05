import { expect } from "chai";
import {
  ApprovedModel,
  getModelVerificationAction,
  loadApprovedModels,
} from "../scripts/model-admission";

const MODEL_MINT = "So11111111111111111111111111111111111111112";
const OTHER_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const CREATOR = "9gEhqja83pNACqP9aorWgAnPpx6Z4Jtj9geVABF6WmQx";
const OTHER_CREATOR = "Vote111111111111111111111111111111111111111";

function approvalsFor(
  mint: string = MODEL_MINT,
  creatorWallet: string = CREATOR
): ApprovedModel[] {
  return loadApprovedModels(JSON.stringify([{ mint, creatorWallet }]));
}

function admission(
  options: {
    suppliedMint?: string;
    metadataMint?: string;
    verifiedCreatorWallets?: string[];
    approvals?: ApprovedModel[];
  } = {}
) {
  return {
    suppliedMint: options.suppliedMint ?? MODEL_MINT,
    metadataMint: options.metadataMint ?? MODEL_MINT,
    verifiedCreatorWallets: options.verifiedCreatorWallets ?? [CREATOR],
    approvals: options.approvals ?? approvalsFor(),
  };
}

describe("model verification admission", () => {
  it("accepts an explicitly approved NFT with its approved verified creator", () => {
    expect(getModelVerificationAction(admission(), false, false)).to.equal(
      "submit"
    );
  });

  it("rejects an unapproved creator", () => {
    expect(() =>
      getModelVerificationAction(
        admission({ verifiedCreatorWallets: [OTHER_CREATOR] }),
        false,
        false
      )
    ).to.throw("is not a verified creator");
  });

  it("rejects a supplied NFT mint absent from the approval list", () => {
    expect(() =>
      getModelVerificationAction(
        admission({
          suppliedMint: OTHER_MINT,
          metadataMint: OTHER_MINT,
        }),
        false,
        false
      )
    ).to.throw("is not explicitly approved");
  });

  it("rejects metadata belonging to a different mint", () => {
    expect(() =>
      getModelVerificationAction(
        admission({ metadataMint: OTHER_MINT }),
        false,
        false
      )
    ).to.throw("fetched metadata belongs to mint");
  });

  it("rejects missing approval configuration", () => {
    expect(() => loadApprovedModels(undefined)).to.throw(
      "no NFT approval is configured"
    );
  });

  it("admits an already-verified approved NFT as a no-op", () => {
    expect(getModelVerificationAction(admission(), true, false)).to.equal(
      "already-verified"
    );
  });

  it("rejects an unapproved NFT in dry-run without reaching any submit action", () => {
    expect(() =>
      getModelVerificationAction(admission({ approvals: [] }), false, true)
    ).to.throw("is not explicitly approved");
  });

  it("returns dry-run only for an admitted NFT", () => {
    expect(getModelVerificationAction(admission(), false, true)).to.equal(
      "dry-run"
    );
  });
});
