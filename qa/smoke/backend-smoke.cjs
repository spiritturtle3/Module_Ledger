
async function main() {
  const url = process.env.BACKEND_HEALTH_URL;

  if (!url) {
    console.log("Backend URL not configured yet.");
    console.log("Smoke test cannot run until backend is ready.");
    return;
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    console.log("PASS: Backend is reachable.");
    console.log("Status:", response.status);
  } catch (error) {
    console.error("FAIL: Backend health check");
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
