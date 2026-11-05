import { after, before, test } from "node:test";
import assert from "node:assert/strict";

import type { Server } from "node:http";

import app from "../src/app.js";

import { isValidIpfsMetadata } from "../src/validators/ipfs.validator.js";
import { buildModelMetadata } from "../../frontend/src/lib/model-metadata.js";

let server: Server;
let baseUrl: string;

const validMetadata = buildModelMetadata({
  name: "ModuLedger Test Model",
  description: "Automated Backend test model",
  imageUri: "ipfs://QmVdBut38Ax9ChqytVep7jFowG8mAcTe5c2Lwwj7SjC2nR",
  imageMimeType: "image/png",
  task: "Text Generation",
  framework: "PyTorch",
  version: "1.0.0",
  creatorWallet: "11111111111111111111111111111111",
  licenseRef: "https://example.com/license",
  modelFile: {
    cid: "Qmf62U7tbC7VuCJsu3WGiUNHKj2CfwpbQnsByBhp51dt5F",
    uri: "ipfs://Qmf62U7tbC7VuCJsu3WGiUNHKj2CfwpbQnsByBhp51dt5F",
    mimeType: "application/zip",
  },
});

before(async () => {
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
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
});

test("ModuLedger Backend automated tests", async (t) => {
  await t.test("Frontend-generated metadata passes the backend contract", () => {
    assert.equal(isValidIpfsMetadata(validMetadata), true);
    assert.equal(validMetadata.creatorWallet, "11111111111111111111111111111111");
    assert.equal(validMetadata.modelFile.cid, "Qmf62U7tbC7VuCJsu3WGiUNHKj2CfwpbQnsByBhp51dt5F");
    assert.equal(validMetadata.modelFile.uri, "ipfs://Qmf62U7tbC7VuCJsu3WGiUNHKj2CfwpbQnsByBhp51dt5F");
    assert.equal(validMetadata.image, "ipfs://QmVdBut38Ax9ChqytVep7jFowG8mAcTe5c2Lwwj7SjC2nR");
    assert.equal(validMetadata.properties.files[0].type, "application/zip");
    assert.equal(validMetadata.properties.files[1].type, "image/png");
  });

  await t.test("Missing required metadata fields are rejected", () => {
    const requiredFields = [
      "name",
      "image",
      "task",
      "framework",
      "version",
      "creatorWallet",
      "licenseRef",
      "modelFile",
    ];
    for (const field of requiredFields) {
      const metadata: Record<string, unknown> = { ...validMetadata };
      delete metadata[field];
      assert.equal(isValidIpfsMetadata(metadata), false, field + " is required");
    }
  });

  await t.test("Missing creator wallet is rejected", () => {
    const metadata = {
      ...validMetadata,
    } as Record<string, unknown>;

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

  await t.test("Invalid metadata field and nested field types are rejected", () => {
    assert.equal(isValidIpfsMetadata({ ...validMetadata, task: 42 }), false);
    assert.equal(
      isValidIpfsMetadata({ ...validMetadata, modelFile: "not an object" }),
      false,
    );
    assert.equal(
      isValidIpfsMetadata({
        ...validMetadata,
        modelFile: { ...validMetadata.modelFile, cid: 123 },
      }),
      false,
    );
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
    const metadata = {
      ...validMetadata,
    } as Record<string, unknown>;

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
