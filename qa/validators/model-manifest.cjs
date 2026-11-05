
function validateManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return ["Manifest must be an object"];
  }

  if (typeof manifest.name !== "string" || !manifest.name.trim()) {
    errors.push("Model name is required");
  }

  if (typeof manifest.version !== "string" || !manifest.version.trim()) {
    errors.push("Model version is required");
  }

  if (
    typeof manifest.package?.cid !== "string" ||
    !manifest.package.cid.trim()
  ) {
    errors.push("Package CID is required");
  }

  if (!/^[a-f0-9]{64}$/i.test(manifest.package?.sha256 || "")) {
    errors.push("Valid SHA-256 checksum is required");
  }

  if (
    typeof manifest.license?.reference !== "string" ||
    !manifest.license.reference.trim()
  ) {
    errors.push("License reference is required");
  }

  return errors;
}

module.exports = { validateManifest };
