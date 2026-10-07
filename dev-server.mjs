// Local dev server for the guard app (macOS/Linux counterpart of start-server.ps1).
// Serves the static app and proxies /api/* and /socket.io/* to the ALEXIOS backend, so the app
// and API share one origin: no CORS, and the refresh cookie just works.
//
//   node dev-server.mjs
//   ALEXIOS_API=http://localhost:4000 PORT=5173 node dev-server.mjs

import http from "node:http";
import net from "node:net";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)));
const PORT = Number(process.env.PORT || 5173);
const API = new URL(process.env.ALEXIOS_API || "http://localhost:4000");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function proxy(req, res) {
  const upstream = http.request(
    {
      hostname: API.hostname,
      port: API.port || 80,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: API.host },
    },
    (up) => {
      res.writeHead(up.statusCode || 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on("error", (err) => {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: `ALEXIOS API unreachable at ${API.origin} (${err.code})` }));
  });
  req.pipe(upstream);
}

async function serveStatic(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = normalize(join(ROOT, pathname));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
  } catch {
    file = join(ROOT, "index.html"); // SPA fallback
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}

const proxied = (url) => url.startsWith("/api/") || url.startsWith("/socket.io/");

/** WebSocket upgrades (Socket.IO): pipe the raw connection through to the API. */
function proxyUpgrade(req, socket, head) {
  if (!proxied(req.url)) return socket.destroy();
  const upstream = net.connect(Number(API.port || 80), API.hostname, () => {
    const headers = { ...req.headers, host: API.host };
    const lines = Object.entries(headers).map(([k, v]) => `${k}: ${v}`);
    upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${lines.join("\r\n")}\r\n\r\n`);
    if (head?.length) upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  const close = () => { upstream.destroy(); socket.destroy(); };
  upstream.on("error", close);
  socket.on("error", close);
}

http
  .createServer((req, res) => (proxied(req.url) ? proxy(req, res) : serveStatic(req, res)))
  .on("upgrade", proxyUpgrade)
  .listen(PORT, () => {
    console.log(`Guard app: http://localhost:${PORT}  (API + Socket.IO proxied to ${API.origin})`);
  });
