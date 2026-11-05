// Test-only credential.
// Automated tests never make real Pinata uploads.
process.env.PINATA_JWT ||= "test-only-jwt-not-used";
