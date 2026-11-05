
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateManifest
} = require("../validators/model-manifest.cjs");

function validManifest() {
  return {
    name: "MedVision AI",
    version: "1.0.0",
    framework: "PyTorch",
    package: {
      cid: "bafyexamplemodelcid",
      sha256: "a".repeat(64)
    },
    license: {
      type: "MIT",
      reference: "https://opensource.org/licenses/MIT"
    }
  };
}

test("Valid model manifest is accepted", () => {
  assert.deepEqual(validateManifest(validManifest()), []);
});

test("Missing model name is rejected", () => {
  const manifest = validManifest();
  delete manifest.name;

  assert.ok(validateManifest(manifest).length > 0);
});

test("Missing model version is rejected", () => {
  const manifest = validManifest();
  delete manifest.version;

  assert.ok(validateManifest(manifest).length > 0);
});

test("Missing package CID is rejected", () => {
  const manifest = validManifest();
  delete manifest.package.cid;

  assert.ok(validateManifest(manifest).length > 0);
});

test("Invalid SHA-256 checksum is rejected", () => {
  const manifest = validManifest();
  manifest.package.sha256 = "invalid-hash";

  assert.ok(validateManifest(manifest).length > 0);
});

test("Missing license reference is rejected", () => {
  const manifest = validManifest();
  delete manifest.license.reference;

  assert.ok(validateManifest(manifest).length > 0);
});
