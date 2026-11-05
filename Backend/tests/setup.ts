// Test-only Pinata credential. Tests must never perform real uploads.
process.env.PINATA_JWT ||= 'test-only-jwt-not-used';
