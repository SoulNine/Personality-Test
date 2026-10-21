// npm run screenshots  -> screenshots/*.png and screenshots/cards/*.png
// Plays through the quiz in headless Chrome (phone-sized), saves screens and share cards,
// and fails if the page logs any JavaScript error.
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import { serve } from "./serve.mjs";
import { chromePath } from "./chrome.mjs";

const out = new URL("../screenshots/", import.meta.url);
await mkdir(new URL("cards/", out), { recursive: true });
const server = await serve(0), base = `http://localhost:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const errors = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function newPage(width = 390, height = 844) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));
  page.on("console", m => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  page.on("requestfailed", r => errors.push(`requestfailed: ${r.url()}`));
  return page;
}
const shot = (page, name, full = false) => page.screenshot({ path: new URL(name, out).pathname, fullPage: full });

// 1. intro -> questions -> reveal -> result, answering like a type 6 (the option whose primary is 6, else first)
const page = await newPage();
await page.goto(base + "/", { waitUntil: "networkidle0" });
await sleep(700); await shot(page, "01-intro.png");
await page.click("#start"); await sleep(700);
await shot(page, "02-question-1.png");
const PREF = [6, 5, 1];
for (let i = 0; i < 10; i++) {
  await page.waitForSelector("#options .option:not([disabled])");
  const idx = await page.evaluate(async (pref) => {
    const { QUESTIONS } = await import("./js/data.js");
    const q = QUESTIONS.find(q => q.text === document.getElementById("q-text").textContent);
    const btns = [...document.querySelectorAll("#options .option")];
    for (const t of pref) { const o = q.options.find(o => o[1] === t); if (o) return btns.findIndex(b => b.textContent === o[0]); }
    return 0;
  }, PREF);
  if (i === 4) await shot(page, "03-question-5.png");
  const btns = await page.$$("#options .option");
  await btns[idx].click();
  await sleep(i === 9 ? 900 : 650);
}
await shot(page, "04-reveal.png");
await sleep(3400);
await shot(page, "05-result.png");
await page.evaluate(() => window.scrollTo(0, 900)); await sleep(400);
await shot(page, "06-result-scrolled.png");
const resultName = await page.$eval("#r-name", e => e.textContent);
await page.close();

// 2. a shared link (friend view), then take the test and see the pair screen
const p2 = await newPage();
await p2.goto(base + "/type/2?w=1", { waitUntil: "networkidle0" });
await sleep(2200);
await shot(p2, "07-friend-view.png");
await p2.click("#f-start"); await sleep(500);
for (let i = 0; i < 10; i++) {
  await p2.waitForSelector("#options .option:not([disabled])");
  await (await p2.$$("#options .option"))[0].click(); await sleep(520);
}
await sleep(3600);
await p2.click("#see-pair"); await sleep(2400);
await shot(p2, "08-pair.png");
const pairTitle = await p2.$eval("#p-title", e => e.textContent);
await p2.close();

// 3. desktop intro
const p3 = await newPage(1366, 820);
await p3.goto(base + "/?compare=9w1", { waitUntil: "networkidle0" }); await sleep(700);
await shot(p3, "09-desktop-intro-compare.png");
// reduced motion check
await p3.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await p3.goto(base + "/?demo=4w5", { waitUntil: "networkidle0" }); await sleep(600);
await shot(p3, "10-desktop-result-reduced-motion.png");
await p3.close();

// 4. share cards for three types (story + square)
const p4 = await newPage();
await p4.goto(base + "/", { waitUntil: "networkidle0" });
for (const [t, w] of [[2, 1], [6, 5], [9, 1]]) for (const format of ["story", "square"]) {
  const data = await p4.evaluate(async (t, w, format) => {
    await window.SoulNine.ensureFonts();
    const c = document.createElement("canvas");
    window.SoulNine.drawCard(c, { type: t, wing: w, format, cfg: window.SoulNine.cfg });
    return c.toDataURL("image/png");
  }, t, w, format);
  await writeFile(new URL(`cards/type-${t}w${w}-${format}.png`, out), Buffer.from(data.split(",")[1], "base64"));
}
await p4.close();

await browser.close(); server.close();
console.log("result of type-6 run:", resultName, "| pair:", pairTitle);
console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "No JavaScript errors.");
process.exit(errors.length ? 1 : 0);
