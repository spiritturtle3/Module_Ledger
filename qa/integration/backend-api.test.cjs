
const test = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL =
  process.env.BACKEND_BASE_URL || "http://localhost:5000";

test("API-01: Health endpoint returns 200", async () => {
  const response = await fetch(`${BASE_URL}/api/health`);
  assert.equal(response.status, 200);

  const data = await response.json();
  assert.equal(data.success, true);
});

test("API-02: Unknown endpoint returns 404", async () => {
  const response = await fetch(
    `${BASE_URL}/api/does-not-exist`
  );

  assert.equal(response.status, 404);
});

test("API-03: Upload without file returns 400", async () => {
  const response = await fetch(
    `${BASE_URL}/api/ipfs/upload-file`,
    { method: "POST" }
  );

  assert.equal(response.status, 400);
});

test("API-04: Invalid metadata JSON returns 400", async () => {
  const response = await fetch(
    `${BASE_URL}/api/ipfs/upload-metadata`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "not-json",
    }
  );

  assert.equal(response.status, 400);
});

test("API-05: Wrong upload field returns 400", async () => {
  const form = new FormData();

  form.append(
    "wrongfield",
    new Blob(["QA test file"], { type: "text/plain" }),
    "test.txt"
  );

  const response = await fetch(
    `${BASE_URL}/api/ipfs/upload-file`,
    {
      method: "POST",
      body: form,
    }
  );

  assert.equal(response.status, 400);
});
