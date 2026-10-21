// npm run build
//  1. writes the 9 share pages type/1.html ... type/9.html (link previews + redirect to the result)
//  2. updates the preview tags in index.html
//  3. renders the preview images og/default.jpg and og/type-1..9.jpg (1200x630 JPEG) with the same
//     canvas code the site uses (needs Chrome/Chromium; skipped with a warning if not found)
import { writeFile, readFile, mkdir } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import cfg from "../site.config.js";
import { TYPES } from "../js/data.js";
import { serve } from "./serve.mjs";
import { chromePath } from "./chrome.mjs";

const root = new URL("..", import.meta.url);
const esc = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const site = cfg.siteUrl.replace(/\/$/, "");

await mkdir(new URL("type/", root), { recursive: true });
await mkdir(new URL("og/", root), { recursive: true });
for (let t = 1; t <= 9; t++) {
  const T = TYPES[t];
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(T.name)} · Soul Nine personality test</title>
<meta name="description" content="${esc(T.tagline)} Which light are you? Take the free 2-minute test.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Soul Nine">
<meta property="og:title" content="${esc(T.name)}: ${esc(T.tagline)}">
<meta property="og:description" content="Which light are you? Take the free 2-minute Soul Nine personality test.">
<meta property="og:image" content="${site}/og/type-${t}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(T.name)} sigil and tagline">
<meta property="og:url" content="${site}/type/${t}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${site}/og/type-${t}.jpg">
<link rel="canonical" href="${site}/type/${t}">
<meta name="theme-color" content="#061a22">
<script>
  var w = new URLSearchParams(location.search).get("w");
  location.replace("../?r=${t}" + (w && /^[1-9]$/.test(w) ? "w" + w : ""));
</script>
<noscript><meta http-equiv="refresh" content="0; url=../?r=${t}"></noscript>
</head>
<body style="background:#061a22;color:#e8f6f6;font-family:system-ui,sans-serif;text-align:center;padding:40px">
<p><a style="color:#bfe8e0" href="../?r=${t}">${esc(T.name)}: see this result and take the test</a></p>
</body>
</html>
`;
  await writeFile(new URL(`type/${t}.html`, root), html);
}
console.log("wrote type/1..9.html");

// index.html preview tags
const idxUrl = new URL("index.html", root);
let idx = await readFile(idxUrl, "utf8");
const og = `<!-- OG:START (written by \`npm run build\` from site.config.js) -->
<meta property="og:type" content="website">
<meta property="og:title" content="Which light are you? · Soul Nine personality test">
<meta property="og:description" content="Ten moments on a misty island. One reflection of who you are. Free, 2 minutes.">
<meta property="og:image" content="${site}/og/default.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${site}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${site}/og/default.jpg">
<!-- OG:END -->`;
idx = idx.replace(/<!-- OG:START[\s\S]*?<!-- OG:END -->/, og);
await writeFile(idxUrl, idx);
console.log("updated index.html preview tags");

// preview images
const exe = chromePath();
if (!exe) { console.warn("Chrome not found: preview images NOT updated (set CHROME_PATH)."); process.exit(0); }
const server = await serve(0);
const port = server.address().port;
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle0" });
await page.waitForFunction(() => window.SoulNine);
async function save(name, fn, arg) {
  const data = await page.evaluate(async (fnName, a) => {
    await window.SoulNine.ensureFonts();
    const c = document.createElement("canvas");
    if (fnName === "default") window.SoulNine.drawDefaultOg(c, window.SoulNine.cfg);
    else window.SoulNine.drawCard(c, { type: a, wing: null, format: "og", cfg: window.SoulNine.cfg });
    return c.toDataURL("image/jpeg", 0.9);
  }, fn, arg);
  await writeFile(new URL(`og/${name}.jpg`, root), Buffer.from(data.split(",")[1], "base64"));
}
await save("default", "default");
for (let t = 1; t <= 9; t++) await save(`type-${t}`, "type", t);
await browser.close(); server.close();
console.log("rendered og/default.jpg and og/type-1..9.jpg");
