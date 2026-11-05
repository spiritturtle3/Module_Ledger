import { after, before, test } from "node:test";
import assert from "node:assert/strict";

import type { Server } from "node:http";

import { isValidIpfsMetadata } from "../src/validators/ipfs.validator.js";

// A dummy JWT allows tests to import the application without
// requiring real Pinata credentials.
// No test below performs a real Pinata upload.
process.env.PINATA_JWT ||= "test-only-jwt-not-used";

let server: Server;
let baseUrl: string;

const validMetadata = {
  name: "ModuLedger Test Model",
  description: "Automated Backend test model",
  image: "https://example.com/model.png",
  task: "Text Generation",
  framework: "PyTorch",
  version: "1.0.0",
  creatorWallet: "11111111111111111111111111111111",
  licenseRef: "https://example.com/license",
  modelFile: {
    cid: "Qmf62U7tbC7VuCJsu3WGiUNHKj2CfwpbQnsByBhp51dt5F",
    uri: "ipfs://Qmf62U7tbC7VuCJsu3WGiUNHKj2CfwpbQnsByBhp51dt5F",
  },
};

before(async () => {
  const { default: app } = await import("../src/app.js");

  server = app.listen(0);

  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Could not determine test server address.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (!server) return;

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

test("ModuLedger Backend automated tests", async (t) => {
  await t.test("Valid manifest passes validation", () => {
    assert.equal(isValidIpfsMetadata(validMetadata), true);
  });

  await t.test("Missing creator wallet is rejected", () => {
    const metadata = { ...validMetadata } as Record<string, unknown>;

    delete metadata.creatorWallet;

    assert.equal(isValidIpfsMetadata(metadata), false);
  });

  await t.test("Invalid wallet address is rejected", () => {
    const metadata = {
      ...validMetadata,
      creatorWallet: "invalid-wallet-address",
    };

    assert.equal(isValidIpfsMetadata(metadata), false);
  });

  await t.test("Invalid CID is rejected", () => {
    const metadata = {
      ...validMetadata,
      modelFile: {
        cid: "invalid-cid",
        uri: "ipfs://invalid-cid",
      },
    };

    assert.equal(isValidIpfsMetadata(metadata), false);
  });

  await t.test("Mismatched CID and URI are rejected", () => {
    const metadata = {
      ...validMetadata,
      modelFile: {
        cid: "Qmf62U7tbC7VuCJsu3WGiUNHKj2CfwpbQnsByBhp51dt5F",
        uri: "ipfs://QmVdBut38Ax9ChqytVep7jFowG8mAcTe5c2Lwwj7SjC2nR",
      },
    };

    assert.equal(isValidIpfsMetadata(metadata), false);
  });

  await t.test("Health endpoint returns HTTP 200", async () => {
    const response = await fetch(`${baseUrl}/api/health`);

    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      success: boolean;
      service: string;
    };

    assert.equal(body.success, true);
    assert.equal(body.service, "moduledger-backend");
  });

  await t.test("Metadata API rejects missing creator wallet", async () => {
    const metadata = { ...validMetadata } as Record<string, unknown>;

    delete metadata.creatorWallet;

    const response = await fetch(`${baseUrl}/api/ipfs/upload-metadata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    });

    assert.equal(response.status, 400);
  });

  await t.test("File API rejects unsupported extensions", async () => {
    const formData = new FormData();

    formData.append(
      "file",
      new Blob(["unsupported test content"], {
        type: "application/octet-stream",
      }),
      "unsupported.exe",
    );

    const response = await fetch(`${baseUrl}/api/ipfs/upload-file`, {
      method: "POST",
      body: formData,
    });

    assert.equal(response.status, 415);
  });

  await t.test("File API rejects fake ZIP content", async () => {
    const formData = new FormData();

    formData.append(
      "file",
      new Blob(["This is not a ZIP archive"], { type: "application/zip" }),
      "fake-model.zip",
    );

    const response = await fetch(`${baseUrl}/api/ipfs/upload-file`, {
      method: "POST",
      body: formData,
    });

    assert.equal(response.status, 415);
  });
});
