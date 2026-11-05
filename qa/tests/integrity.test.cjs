
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const fixtureDir = path.join(__dirname, "../fixtures");

const manifest = JSON.parse(
  fs.readFileSync(
    path.join(fixtureDir, "sample-manifest.json"),
    "utf8"
  )
);

const modelPackage = fs.readFileSync(
  path.join(fixtureDir, "model-package.zip")
);

function calculateHash(data) {
  return crypto
    .createHash("sha256")
    .update(data)
    .digest("hex");
}

test("Manifest contains required model information", () => {
  assert.ok(manifest.name);
  assert.ok(manifest.version);
  assert.ok(manifest.framework);
  assert.ok(manifest.package.filename);
  assert.match(manifest.package.sha256, /^[a-f0-9]{64}$/);
});

test("Model package checksum matches manifest", () => {
  const actualHash = calculateHash(modelPackage);

  assert.equal(
    actualHash,
    manifest.package.sha256
  );
});

test("Modified model package fails integrity verification", () => {
  const modifiedPackage = Buffer.concat([
    modelPackage,
    Buffer.from("unauthorized modification")
  ]);

  const modifiedHash = calculateHash(modifiedPackage);

  assert.notEqual(
    modifiedHash,
    manifest.package.sha256
  );
});
