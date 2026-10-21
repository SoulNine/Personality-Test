// Share cards and link-preview images, drawn on a canvas (same code in the browser and at build time).
import { TYPES, NEIGHBOURS } from "./data.js";
import { drawSigil, hexA } from "./sigils.js";

export const FORMATS = {
  story: { w: 1080, h: 1920 },   // TikTok / Instagram / Snapchat stories
  square: { w: 1080, h: 1080 },  // feeds, X, WhatsApp
  og: { w: 1200, h: 630 },       // link previews (Open Graph)
};
const SERIF = '"Cormorant SN", "Cormorant Garamond", Georgia, serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export async function ensureFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  try { await Promise.all([document.fonts.load(`600 80px "Cormorant SN"`), document.fonts.load(`500 40px "Cormorant SN"`)]); } catch (e) { /* fall back */ }
}

function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

export function drawBackground(ctx, w, h, type, seed = 7) {
  const color = type ? TYPES[type].color : "#bfe8e0";
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#04121a"); g.addColorStop(0.45, "#0a2a35"); g.addColorStop(1, "#061a22");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const r = rng(seed * 97 + (type || 0));
  // mist banks
  for (let i = 0; i < 7; i++) {
    const x = r() * w, y = h * (0.15 + r() * 0.85), rad = Math.max(w, h) * (0.25 + r() * 0.35);
    const m = ctx.createRadialGradient(x, y, 0, x, y, rad);
    m.addColorStop(0, `rgba(150,210,215,${0.05 + r() * 0.05})`); m.addColorStop(1, "rgba(150,210,215,0)");
    ctx.fillStyle = m; ctx.fillRect(0, 0, w, h);
  }
  // type-coloured light from above
  const l = ctx.createRadialGradient(w / 2, h * 0.32, 0, w / 2, h * 0.32, Math.max(w, h) * 0.6);
  l.addColorStop(0, hexA(color, 0.16)); l.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = l; ctx.fillRect(0, 0, w, h);
  // motes
  for (let i = 0; i < Math.round((w * h) / 16000); i++) {
    const x = r() * w, y = r() * h, s = 0.8 + r() * 2.6, a = 0.15 + r() * 0.55;
    const m = ctx.createRadialGradient(x, y, 0, x, y, s * 4);
    m.addColorStop(0, `rgba(230,250,255,${a})`); m.addColorStop(1, "rgba(230,250,255,0)");
    ctx.fillStyle = m; ctx.beginPath(); ctx.arc(x, y, s * 4, 0, Math.PI * 2); ctx.fill();
  }
}

function wrap(ctx, text, maxW) {
  const words = text.split(" "), lines = []; let line = "";
  for (const wd of words) {
    const t = line ? line + " " + wd : wd;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = wd; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}
function text(ctx, s, x, y, font, color, align = "center", spacing = 0) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
  if ("letterSpacing" in ctx) ctx.letterSpacing = spacing + "px";
  ctx.fillText(s, x, y);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
}
function paragraph(ctx, s, x, y, maxW, font, color, lh) {
  ctx.font = font; const lines = wrap(ctx, s, maxW);
  lines.forEach((ln, i) => text(ctx, ln, x, y + i * lh, font, color));
  return y + lines.length * lh;
}

// type: 1..9, wing: neighbour or null, format: "story" | "square" | "og", cfg: site config
export function drawCard(canvas, { type, wing, format = "story", cfg = {} }) {
  const { w, h } = FORMATS[format];
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  const T = TYPES[type], color = T.color;
  drawBackground(ctx, w, h, type);
  const domain = cfg.cardDomain || "";
  const small = `Enneagram Type ${type}${wing ? ` \u00b7 ${type}w${wing}` : ""}`;
  const wingLine = wing ? `with ${TYPES[wing].wing}` : "";
  ctx.shadowColor = "transparent";

  if (format === "story") {
    text(ctx, "SOUL NINE", w / 2, 150, `600 44px ${SERIF}`, "rgba(225,245,245,0.85)", "center", 14);
    text(ctx, "MY LIGHT IS", w / 2, 330, `500 30px ${SANS}`, "rgba(200,235,235,0.75)", "center", 8);
    drawSigil(ctx, type, w / 2, 760, 300, { color });
    glowText(ctx, T.name, w / 2, 1250, `600 118px ${SERIF}`, "#f4fbfb", color);
    let y = paragraph(ctx, T.tagline, w / 2, 1350, 860, `500 54px ${SERIF}`, hexA(color, 0.95), 66);
    if (wingLine) y = paragraph(ctx, wingLine, w / 2, y + 30, 860, `400 36px ${SANS}`, "rgba(215,240,240,0.8)", 46);
    paragraph(ctx, "\u201c" + T.core[0] + "\u201d", w / 2, Math.max(y + 70, 1560), 820, `500 40px ${SERIF}`, "rgba(225,245,245,0.85)", 52);
    text(ctx, "Which light are you?", w / 2, 1780, `600 46px ${SERIF}`, "#f4fbfb");
    if (domain) text(ctx, domain, w / 2, 1835, `500 32px ${SANS}`, hexA(color, 0.95), "center", 2);
    text(ctx, small, w / 2, 1885, `400 22px ${SANS}`, "rgba(200,230,230,0.55)", "center", 2);
  } else if (format === "square") {
    text(ctx, "SOUL NINE", w / 2, 92, `600 36px ${SERIF}`, "rgba(225,245,245,0.85)", "center", 12);
    drawSigil(ctx, type, w / 2, 370, 200, { color });
    glowText(ctx, T.name, w / 2, 700, `600 96px ${SERIF}`, "#f4fbfb", color);
    let y = paragraph(ctx, T.tagline, w / 2, 780, 900, `500 46px ${SERIF}`, hexA(color, 0.95), 56);
    if (wingLine) paragraph(ctx, wingLine, w / 2, y + 16, 900, `400 30px ${SANS}`, "rgba(215,240,240,0.8)", 40);
    text(ctx, "Which light are you?" + (domain ? "  \u00b7  " + domain : ""), w / 2, 1000, `500 36px ${SERIF}`, "#f4fbfb");
    text(ctx, small, w / 2, 1046, `400 20px ${SANS}`, "rgba(200,230,230,0.55)", "center", 2);
  } else { // og 1200x630
    drawSigil(ctx, type, 300, 315, 205, { color });
    text(ctx, "SOUL NINE \u00b7 PERSONALITY TEST", 590, 150, `500 26px ${SANS}`, "rgba(210,240,240,0.75)", "left", 5);
    glowText(ctx, T.name, 588, 262, `600 92px ${SERIF}`, "#f4fbfb", color, "left");
    ctx.font = `500 44px ${SERIF}`;
    wrap(ctx, T.tagline, 560).forEach((ln, i) => text(ctx, ln, 590, 335 + i * 52, `500 44px ${SERIF}`, hexA(color, 0.95), "left"));
    text(ctx, "Which light are you? Take the free test.", 590, 500, `500 30px ${SANS}`, "#e8f6f6", "left");
    if (domain) text(ctx, domain, 590, 545, `500 26px ${SANS}`, hexA(color, 0.9), "left", 2);
    text(ctx, `Enneagram Type ${type}`, 590, 590, `400 18px ${SANS}`, "rgba(200,230,230,0.55)", "left", 2);
  }
  return canvas;
}

// Default preview image (no type): the nine sigils in a ring around the title.
export function drawDefaultOg(canvas, cfg = {}) {
  const { w, h } = FORMATS.og; canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  drawBackground(ctx, w, h, null, 3);
  for (let t = 1; t <= 9; t++) {
    const a = -Math.PI / 2 + ((t % 9) / 9) * Math.PI * 2;
    drawSigil(ctx, t, w / 2 + Math.cos(a) * 470, h / 2 + Math.sin(a) * 235, 52, { color: TYPES[t].color, glow: 0.8 });
  }
  glowText(ctx, "Soul Nine", w / 2, 300, `600 96px ${SERIF}`, "#f4fbfb", "#bfe8e0");
  text(ctx, "Which light are you?", w / 2, 365, `500 44px ${SERIF}`, "#cfeff0");
  text(ctx, "A 2-minute personality test" + (cfg.cardDomain ? " \u00b7 " + cfg.cardDomain : ""), w / 2, 420, `400 26px ${SANS}`, "rgba(215,240,240,0.8)");
  return canvas;
}

function glowText(ctx, s, x, y, font, fill, glow, align = "center") {
  ctx.save(); ctx.font = font; ctx.textAlign = align; ctx.fillStyle = fill;
  ctx.shadowColor = glow; ctx.shadowBlur = 28; ctx.fillText(s, x, y);
  ctx.shadowBlur = 0; ctx.fillText(s, x, y); ctx.restore();
}

export function cardToBlob(canvas) {
  return new Promise(res => canvas.toBlob(b => res(b), "image/png"));
}
export { NEIGHBOURS };
