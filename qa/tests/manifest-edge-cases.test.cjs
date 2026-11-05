
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateManifest
} = require("../validators/model-manifest.cjs");

function validManifest() {
  return {
    name: "Demo Model",
    version: "1.0.0",
    package: {
      cid: "bafyplaceholder",
      sha256: "a".repeat(64)
    },
    license: {
      reference: "https://example.com/license"
    }
  };
}

// Test 1: Null manifest
test("Rejects null manifest", () => {
  const errors = validateManifest(null);
  assert.ok(errors.length > 0);
});

// Test 2: Array instead of object
test("Rejects array manifest", () => {
  const errors = validateManifest([]);
  assert.ok(errors.length > 0);
});

// Test 3: String instead of object
test("Rejects string manifest", () => {
  const errors = validateManifest("invalid manifest");
  assert.ok(errors.length > 0);
});

// Test 4: Missing package object
test("Rejects missing package object", () => {
  const manifest = validManifest();
  delete manifest.package;

  const errors = validateManifest(manifest);

  assert.ok(errors.includes("Package CID is required"));
  assert.ok(
    errors.includes("Valid SHA-256 checksum is required")
  );
});

// Test 5: Missing license object
test("Rejects missing license object", () => {
  const manifest = validManifest();
  delete manifest.license;

  const errors = validateManifest(manifest);

  assert.ok(
    errors.includes("License reference is required")
  );
});

// Test 6: Whitespace-only required fields
test("Rejects whitespace-only fields", () => {
  const manifest = validManifest();

  manifest.name = "   ";
  manifest.version = "   ";
  manifest.package.cid = "   ";
  manifest.license.reference = "   ";

  const errors = validateManifest(manifest);

  assert.ok(errors.includes("Model name is required"));
  assert.ok(errors.includes("Model version is required"));
  assert.ok(errors.includes("Package CID is required"));
  assert.ok(errors.includes("License reference is required"));
});
