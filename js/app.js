// Soul Nine quiz - screens, flow, sharing.
import cfg from "../site.config.js";
import { QUESTIONS, TYPES } from "./data.js";
import { score, encode, decode } from "./scoring.js";
import { drawSigil } from "./sigils.js";
import { drawCard, drawDefaultOg, ensureFonts, cardToBlob } from "./card.js";
import { pairing } from "./pairs.js";
import { startMotes, createAmbient } from "./ambient.js";

const $ = id => document.getElementById(id);
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const state = { answers: Array(QUESTIONS.length).fill(null), order: [], qi: 0, result: null, friend: null };

// ---------- screens ----------
let current = null;
function show(id, focusId) {
  const next = $(id);
  if (current && current !== next) {
    current.classList.remove("in");
    const prev = current;
    setTimeout(() => { prev.hidden = true; }, reduced ? 0 : 250);
  }
  setTimeout(() => {
    next.hidden = false;
    requestAnimationFrame(() => next.classList.add("in"));
    if (focusId) $(focusId).focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, current && current !== next && !reduced ? 260 : 0);
  current = next;
}

// ---------- quiz ----------
function shuffle(n) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function start() {
  state.answers.fill(null); state.qi = 0;
  state.order = QUESTIONS.map(q => shuffle(q.options.length));   // options shown in random order
  renderQuestion(); show("question", "q-text");
}
function renderQuestion() {
  const q = QUESTIONS[state.qi], n = QUESTIONS.length;
  $("q-count").textContent = `${state.qi + 1} of ${n}`;
  $("progress-bar").style.width = `${(state.qi / n) * 100}%`;
  $("q-text").textContent = q.text;
  $("live").textContent = `Question ${state.qi + 1} of ${n}`;
  const box = $("options"); box.innerHTML = "";
  state.order[state.qi].forEach((oi, pos) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "option"; b.textContent = q.options[oi][0];
    b.style.setProperty("--d", `${pos * 70}ms`);
    if (state.answers[state.qi] === oi) b.classList.add("chosen");
    b.addEventListener("click", () => choose(oi, b));
    box.appendChild(b);
  });
  $("back").hidden = state.qi === 0;
  const sec = $("question"); sec.classList.remove("swap"); void sec.offsetWidth; sec.classList.add("swap");
}
function choose(oi, btn) {
  state.answers[state.qi] = oi;
  btn.classList.add("chosen");
  [...$("options").children].forEach(b => (b.disabled = true));
  setTimeout(() => {
    if (state.qi < QUESTIONS.length - 1) { state.qi++; renderQuestion(); $("q-text").focus({ preventScroll: true }); }
    else finish();
  }, reduced ? 80 : 380);
}
function back() { if (state.qi > 0) { state.qi--; renderQuestion(); $("q-text").focus({ preventScroll: true }); } }

function finish() {
  state.result = score(state.answers);
  $("progress-bar").style.width = "100%";
  try { localStorage.setItem("sn-last", encode(state.result.core, state.result.wing)); } catch (e) { /* private mode */ }
  show("reveal");
  setTimeout(() => { renderResult(); show("result", "r-name"); animateSigil($("r-sigil"), state.result.core); }, reduced ? 300 : 2300);
}

// ---------- result ----------
function shareUrl(core, wing) {
  const path = `/type/${core}${cfg.prettyUrls ? "" : ".html"}`;
  return `${cfg.siteUrl}${path}${wing ? `?w=${wing}` : ""}`;
}
function fillType(prefix, core, wing) {
  const T = TYPES[core];
  $(`${prefix}-name`).textContent = T.name;
  $(`${prefix}-tagline`).textContent = T.tagline;
  $(`${prefix}-wing`).textContent = wing ? `with ${TYPES[wing].wing} (${TYPES[wing].name} wing)` : "";
  const ul = $(`${prefix}-core`); ul.innerHTML = "";
  T.core.forEach(line => { const li = document.createElement("li"); li.textContent = line; ul.appendChild(li); });
  $(`${prefix}-small`).textContent = `Enneagram Type ${core}${wing ? ` · ${core}w${wing}` : ""}`;
  document.documentElement.style.setProperty("--type", T.color);
}
function renderResult() {
  const r = state.result, T = TYPES[r.core];
  fillType("r", r.core, r.wing);
  $("r-shadow").textContent = T.shadow;
  $("r-growth").textContent = T.growth;
  const close = $("r-close");
  close.hidden = !r.closeCall;
  if (r.closeCall) close.textContent = `A close call: ${TYPES[r.runnerUp].name} shines almost as brightly in you.`;
  const pct = cfg.typeShare && cfg.typeShare.enabled ? cfg.typeShare.percentByType[r.core] : null;
  $("r-share").hidden = pct == null;
  if (pct != null) $("r-share").textContent = `${pct}% of people who took the test share your light.`;
  const mix = $("r-mix"); mix.innerHTML = "";
  [1, 2, 3, 4, 5, 6, 7, 8, 9].sort((a, b) => r.percent[b] - r.percent[a]).forEach(t => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="mix-name"></span><span class="bar"><span style="width:${r.percent[t].toFixed(1)}%"></span></span><span class="mix-val">${Math.round(r.percent[t])}%</span>`;
    li.querySelector(".mix-name").textContent = TYPES[t].name;
    mix.appendChild(li);
  });
  const f = state.friend;
  $("r-compare").hidden = !f;
  if (f) $("see-pair").textContent = `See how you fit with ${TYPES[f.core].name}`;
}

function animateSigil(canvas, type, small = false) {
  const ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height, color = TYPES[type].color;
  const r = w * (small ? 0.36 : 0.38);
  const t0 = performance.now(), dur = reduced ? 1 : 1800;
  function frame(t) {
    const p = Math.min(1, (t - t0) / dur);
    ctx.clearRect(0, 0, w, h);
    drawSigil(ctx, type, w / 2, h / 2, r, { progress: 1 - Math.pow(1 - p, 3), color });
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ---------- friend / pair ----------
function showFriend(f) {
  fillType("f", f.core, f.wing);
  show("friend", "f-name");
  animateSigil($("f-sigil"), f.core);
}
function showPair() {
  const me = state.result.core, them = state.friend.core, p = pairing(me, them);
  $("p-a").textContent = `You: ${TYPES[me].name}`;
  $("p-b").textContent = `Them: ${TYPES[them].name}`;
  $("p-title").textContent = p.title;
  const box = $("p-lines"); box.innerHTML = "";
  p.lines.forEach(l => { const el = document.createElement("p"); el.textContent = l; box.appendChild(el); });
  show("pair", "p-title");
  animateSigil($("p-sigil-a"), me, true); animateSigil($("p-sigil-b"), them, true);
}

// ---------- sharing ----------
function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("on"); setTimeout(() => t.classList.remove("on"), 3200); }
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
}
async function shareCard(format) {
  const r = state.result; if (!r) return;
  await ensureFonts();
  const canvas = drawCard($("card-canvas"), { type: r.core, wing: r.wing, format, cfg });
  const blob = await cardToBlob(canvas);
  const name = `soul-nine-${TYPES[r.core].name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}-${format}.png`;
  const file = new File([blob], name, { type: "image/png" });
  const url = shareUrl(r.core, r.wing);
  const text = `My light is ${TYPES[r.core].name}. Which light are you?`;
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "Soul Nine", text: `${text} ${url}` }); return; }
    catch (e) { if (e && e.name === "AbortError") return; }
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  const ok = await copy(url);
  toast(ok ? "Card saved. Link copied, paste it with your post." : "Card saved.");
}
async function shareLink(compare) {
  const r = state.result; if (!r) return;
  const url = shareUrl(r.core, r.wing);
  const text = compare ? `I'm ${TYPES[r.core].name}. Take the test and see how our lights fit together:` : `My light is ${TYPES[r.core].name}. Which light are you?`;
  if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try { await navigator.share({ title: "Soul Nine", text, url }); return; } catch (e) { if (e && e.name === "AbortError") return; }
  }
  toast((await copy(url)) ? "Link copied." : url);
}

// ---------- setup ----------
function setupConfig() {
  for (const id of ["steam", "p-steam"]) $(id).href = cfg.steamUrl;
  $("steam").textContent = cfg.steamButtonText || "Wishlist Soul Nine on Steam";
  if (cfg.trailerUrl) { $("trailer").href = cfg.trailerUrl; $("trailer").hidden = false; }
  const s = $("socials"), labels = { tiktok: "TikTok", youtube: "YouTube", x: "X", instagram: "Instagram", discord: "Discord" };
  Object.entries(cfg.social || {}).forEach(([k, url]) => {
    if (!url) return;
    const a = document.createElement("a"); a.href = url; a.textContent = labels[k] || k; a.target = "_blank"; a.rel = "noopener"; s.appendChild(a);
  });
  const an = cfg.analytics || {};
  if (an.cloudflareToken) {
    const sc = document.createElement("script"); sc.defer = true; sc.src = "https://static.cloudflareinsights.com/beacon.min.js";
    sc.setAttribute("data-cf-beacon", JSON.stringify({ token: an.cloudflareToken })); document.head.appendChild(sc);
  } else if (an.plausibleDomain) {
    const sc = document.createElement("script"); sc.defer = true; sc.src = "https://plausible.io/js/script.js";
    sc.setAttribute("data-domain", an.plausibleDomain); document.head.appendChild(sc);
  }
}

function init() {
  setupConfig();
  startMotes($("motes"));
  const amb = createAmbient();
  $("sound").addEventListener("click", () => {
    const on = amb.toggle();
    $("sound").setAttribute("aria-pressed", String(on));
    $("sound").setAttribute("aria-label", on ? "Ambient sound on" : "Ambient sound off");
  });
  $("start").addEventListener("click", start);
  $("f-start").addEventListener("click", start);
  $("back").addEventListener("click", back);
  $("retake").addEventListener("click", start);
  $("share-story").addEventListener("click", () => shareCard("story"));
  $("share-square").addEventListener("click", () => shareCard("square"));
  $("copy-link").addEventListener("click", () => shareLink(false));
  $("compare-friend").addEventListener("click", () => shareLink(true));
  $("see-pair").addEventListener("click", showPair);
  $("p-back").addEventListener("click", () => show("result", "r-name"));
  document.addEventListener("keydown", e => {
    if (current !== $("question") || !/^[1-4]$/.test(e.key)) return;
    const b = $("options").children[+e.key - 1]; if (b && !b.disabled) b.click();
  });

  const params = new URLSearchParams(location.search);
  const friend = decode(params.get("r")) || decode(params.get("compare"));
  state.friend = friend;
  if (friend && params.get("r")) { showFriend(friend); }
  else {
    if (friend) { const inv = $("invite"); inv.hidden = false; inv.textContent = `Your friend's light is ${TYPES[friend.core].name}. Take the test to see how your lights fit together.`; }
    show("intro");
  }
  // dev/test hook: ?demo=6w5 jumps straight to that result
  const demo = decode(params.get("demo"));
  if (demo) {
    state.result = { core: demo.core, wing: demo.wing, runnerUp: demo.wing, closeCall: false, balancedWing: false, percent: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map(t => [t, t === demo.core ? 30 : t === demo.wing ? 20 : 50 / 7])) };
    renderResult(); show("result", "r-name"); animateSigil($("r-sigil"), demo.core);
  }
}

// exposed for the build script (link-preview images) and tests
window.SoulNine = { drawCard, drawDefaultOg, ensureFonts, cfg, TYPES };
init();
