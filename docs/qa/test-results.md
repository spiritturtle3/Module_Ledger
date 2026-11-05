# ModuLedger — QA Test Results

## Environment
- Network: Solana Devnet
- Frontend: Not configured
- Backend: Not configured
- Blockchain: Not configured

## Test Results

| ID | Test | Status |
|---|---|---|
| QA-01 | Frontend loads | Not Run |
| QA-02 | Wallet connects | Not Run |
| QA-03 | File upload | Not Run |
| QA-04 | Manifest creation | Not Run |
| QA-05 | IPFS retrieval | Not Run |
| QA-06 | NFT minting | Not Run |
| QA-07 | NFT listing | Not Run |
| QA-08 | NFT purchase | Not Run |
| QA-09 | Seller settlement | Not Run |
| QA-10 | Wrong seller rejection | Not Run |
| QA-11 | Wrong mint rejection | Not Run |
| QA-12 | Invalid fee rejection | Not Run |
| QA-13 | Duplicate listing rejection | Not Run |

## Bugs Found

None reported yet.

## Evidence

Transaction signatures, screenshots and logs
will be added after testing.

## Local Package Integrity Tests

| Test | Status |
|---|---|
| Manifest required fields | Passed |
| Model package SHA-256 verification | Passed |
| Modified package detection | Passed |

Command:
node --test --test-reporter=spec qa/tests/integrity.test.cjs

Result: 3 passed, 0 failed.

Note: These tests use local sample files.
Backend and IPFS integration have not yet been tested.
## Automated QA Summary

- Package integrity tests: 3 passed
- Manifest validation tests: 6 passed
- Total automated tests: 9 passed
- Failed: 0
- CI: GitHub Actions passed

Note: Tests use local fixtures and a provisional
manifest validator. Backend, IPFS, and blockchain
integration are not yet verified.

## Local QA Automation Summary

- Package integrity: 3 passed
- Manifest validation: 6 passed
- Manifest edge cases: 6 passed
- Total: 15 passed, 0 failed

Command:
node --test --test-reporter=spec

Note: Tests use local fixtures and a provisional
manifest validator. Backend, IPFS, and blockchain
integration remain untested.

### API-03: Upload Without File
- Endpoint: POST /api/ipfs/upload-file
- Expected: HTTP 400
- Actual: HTTP 400
- Result: PASS
- Response: No file uploaded. Use the form-data field named file.
### API-04: Malformed Metadata JSON
- Endpoint: POST /api/ipfs/upload-metadata
- Expected: HTTP 400
- Actual: HTTP 400
- Result: PASS
### API-05: Wrong Upload Field
- Endpoint: POST /api/ipfs/upload-file
- Expected: HTTP 400
- Actual: HTTP 400
- Result: PASS
### FE-01: Frontend Dependency Installation
- Command: npm ci
- Result: PASS
- Security finding: 8 moderate npm audit findings
- Action: Investigate minimatch/ESLint dependency chain

### FE-02: Frontend Production Build
- Command: npm run build
- Framework: Next.js 16.4.5
- TypeScript: PASS
- Compilation: PASS
- Static generation: PASS
- Overall result: PASS

### FE-03: Frontend Browser Test
- URL: http://localhost:3000
- Result: Pending
### FE-03: Frontend Development Server
- Command: npm run dev
- URL: http://localhost:3000
- Expected: Homepage responds successfully
- Actual: HTTP 200
- Result: PASS (server response)
- Browser UI verification: Pending
- Warning: Cross-origin HMR request blocked from network IP
### API-06: Real Pinata Model Upload
- Endpoint: POST /api/ipfs/upload-file
- Test file: qa/fixtures/model-package.zip
- Expected: HTTP 201 with valid CID
- Actual: HTTP 201
- CID: QmbGZDuzsf1k5ZucB7So1F2vith3nfWFVEPtHL8xA8V9RN
- Result: PASS
- Notes: Real Pinata upload successful

### API-07: IPFS Download Integrity
- Expected: Downloaded ZIP SHA-256 matches original
- Actual: Pending
- Result: NOT RUN
### API-08: Real NFT Metadata Upload
- Endpoint: POST /api/ipfs/upload-metadata
- Expected: Successful upload with valid CID
- Actual: Upload successful
- CID: QmTXt1nXFxQiwhkTgg9QTBhyWozN4isVS96MRwUU6GjHHm
- Result: PASS
### API-09: NFT Metadata Retrieval and Verification
- Metadata CID: QmTXt1nXFxQiwhkTgg9QTBhyWozN4isVS96MRwUU6GjHHm
- Expected: Retrieved metadata matches uploaded JSON
- Actual: All checked fields matched
- Result: PASS
- Notes: Verified name, version, framework, modelCid, and image.
## Backend Regression Testing — PR #6

- Commit tested: e22d6bb
- Dependency installation: PASS
- Backend automated tests: PASS (10/10)
- TypeScript build: PASS
- New validation: Manifest, wallet, CID, and ZIP signature
- Real Pinata upload after PR #6: NOT YET RETESTED

## Backend Regression Testing — PR #6

- Commit: e22d6bb
- Backend unit tests: PASS (10/10)
- TypeScript build: PASS
- API-10: ZIP upload with file-signature validation — PENDING
- API-11: Metadata upload with updated schema — PENDING
## Final Integration QA — 5 November 2026

### Passed
- QA manifest and integrity tests: 15/15 passed.
- Backend API and Solana PDA tests: 13/13 passed when run together.
- Backend TypeScript checks and production build: passed.
- Frontend dependency installation and production build: passed.
- Frontend routes: Home, Marketplace, Publish, Collections and Dashboard confirmed working.
- Solana Devnet program: deployed and executable.
- Devnet marketplace PDA: matched the deployed marketplace address.
- Backend health and Solana health endpoints: passed.
- Backend marketplace API: successfully returned marketplace data.
- Marketplace name: moduledger-demo.

### Open findings
- Wallet hydration mismatch: fix requires verification.
- Wallet connection and Devnet configuration: final QA pending.
- Frontend-to-backend-to-IPFS upload: end-to-end testing pending.
- NFT minting: blocked by verified collection/model NFT prerequisites.
- NFT listing, purchase and delisting: end-to-end testing blocked.
- Backend npm test script runs only 3 PDA tests by default.
- Backend dependency audit: 18 findings (6 high, 12 moderate).
- Frontend dependency audit: 25 findings (2 high, 23 moderate).
- MongoDB is optional for the current demo.

### Overall status
Integration testing in progress. Not yet approved for real-money transactions.