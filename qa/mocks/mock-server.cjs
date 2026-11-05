
const http = require("node:http");

const PORT = 5050;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: "ok",
      service: "ModuLedger Mock Backend"
    }));
    return;
  }

  if (req.url === "/error") {
    res.writeHead(500);
    res.end(JSON.stringify({
      status: "error",
      message: "Simulated backend failure"
    }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({
    error: "Not found"
  }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(
    `Mock backend running at http://127.0.0.1:${PORT}`
  );
});
