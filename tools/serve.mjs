// Tiny static server for local testing: npm run serve  ->  http://localhost:8080
// Mimics Cloudflare Pages "pretty URLs": /type/6 serves type/6.html.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain" };
export function serve(port = Number(process.env.PORT) || 8080) {
  const server = createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    let file = normalize(join(root, p));
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    try { await stat(file); } catch { if (!extname(file)) file += ".html"; }
    try {
      const body = await readFile(file);
      res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" }).end(body);
    } catch { res.writeHead(404).end("not found"); }
  });
  return new Promise(r => server.listen(port, () => r(server)));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) serve().then(s => console.log(`Soul Nine quiz on http://localhost:${s.address().port}`));
