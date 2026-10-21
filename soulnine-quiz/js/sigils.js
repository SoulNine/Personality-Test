// Procedural glowing sigils, one per type, in a shared style:
// outer double ring + nine small lights (this type's light is brighter) + a type-specific glyph.
// drawSigil(ctx, type, cx, cy, r, { progress: 0..1 (draw-in animation), color, glow })

const TAU = Math.PI * 2;

function stroke(ctx, path, p, len) {
  // Draws `path` partially when p < 1 (dash trick), fully when p >= 1.
  ctx.beginPath(); path(ctx);
  if (p < 1) { ctx.setLineDash([len * p, len]); } else { ctx.setLineDash([]); }
  ctx.stroke(); ctx.setLineDash([]);
}

const GLYPHS = {
  // 1 Sundial: dial ring with ticks, a raised gnomon and its shadow line.
  1(ctx, g, p) {
    stroke(ctx, c => c.arc(0, 0, g * 0.78, 0, TAU), p, g * 5);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU, r1 = g * (i % 3 === 0 ? 0.6 : 0.68);
      stroke(ctx, c => { c.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); c.lineTo(Math.cos(a) * g * 0.78, Math.sin(a) * g * 0.78); }, p, g);
    }
    stroke(ctx, c => { c.moveTo(-g * 0.05, g * 0.1); c.lineTo(-g * 0.42, -g * 0.48); c.lineTo(g * 0.05, -g * 0.02); }, p, g * 2);
    stroke(ctx, c => { c.moveTo(0, 0); c.lineTo(g * 0.5, g * 0.32); }, p, g);
  },
  // 2 Harbor: an embracing bay around a small light, with a calm waterline.
  2(ctx, g, p) {
    stroke(ctx, c => c.arc(0, -g * 0.05, g * 0.62, Math.PI * 0.05, Math.PI * 0.95), p, g * 3);
    stroke(ctx, c => c.arc(0, -g * 0.05, g * 0.8, Math.PI * 0.12, Math.PI * 0.88), p, g * 3);
    stroke(ctx, c => c.arc(0, -g * 0.08, g * 0.13, 0, TAU), p, g);
    stroke(ctx, c => { c.moveTo(-g * 0.45, g * 0.22); c.quadraticCurveTo(-g * 0.22, g * 0.14, 0, g * 0.22); c.quadraticCurveTo(g * 0.22, g * 0.3, g * 0.45, g * 0.22); }, p, g * 1.2);
    for (const a of [-0.5, 0, 0.5]) stroke(ctx, c => { const ang = -Math.PI / 2 + a; c.moveTo(Math.cos(ang) * g * 0.22, -g * 0.08 + Math.sin(ang) * g * 0.22); c.lineTo(Math.cos(ang) * g * 0.36, -g * 0.08 + Math.sin(ang) * g * 0.36); }, p, g * 0.3);
  },
  // 3 Summit: twin peaks with a rising spark above.
  3(ctx, g, p) {
    stroke(ctx, c => { c.moveTo(-g * 0.75, g * 0.5); c.lineTo(-g * 0.25, -g * 0.05); c.lineTo(-g * 0.05, g * 0.2); c.lineTo(g * 0.25, -g * 0.35); c.lineTo(g * 0.75, g * 0.5); c.closePath(); }, p, g * 4);
    stroke(ctx, c => { c.moveTo(g * 0.12, -g * 0.2); c.lineTo(g * 0.25, -g * 0.1); c.lineTo(g * 0.38, -g * 0.2); }, p, g * 0.5);
    const sy = -g * 0.68, s = g * 0.16;
    stroke(ctx, c => { c.moveTo(g * 0.25, sy - s); c.quadraticCurveTo(g * 0.27, sy - 0.02 * g, g * 0.25 + s, sy); c.quadraticCurveTo(g * 0.27, sy + 0.02 * g, g * 0.25, sy + s);
      c.quadraticCurveTo(g * 0.23, sy + 0.02 * g, g * 0.25 - s, sy); c.quadraticCurveTo(g * 0.23, sy - 0.02 * g, g * 0.25, sy - s); }, p, g * 1.2);
  },
  // 4 Nightbloom: six petals opening around a bright centre, under a thin crescent.
  4(ctx, g, p) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU - Math.PI / 2;
      stroke(ctx, c => { c.save(); c.rotate(a); c.moveTo(0, 0); c.quadraticCurveTo(g * 0.28, -g * 0.22, g * 0.62, 0); c.quadraticCurveTo(g * 0.28, g * 0.22, 0, 0); c.restore(); }, p, g * 1.6);
    }
    stroke(ctx, c => c.arc(0, 0, g * 0.1, 0, TAU), p, g);
    stroke(ctx, c => c.arc(0, 0, g * 0.85, Math.PI * 1.15, Math.PI * 1.85), p, g * 2);
  },
  // 5 Starglass: nested lenses with an eight-ray star at the focus.
  5(ctx, g, p) {
    [0.78, 0.52, 0.28].forEach(k => stroke(ctx, c => c.arc(0, 0, g * k, 0, TAU), p, g * 5 * k));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + Math.PI / 8, r = i % 2 ? g * 0.18 : g * 0.12;
      stroke(ctx, c => { c.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }, p, g * 0.3);
    }
    stroke(ctx, c => c.arc(-g * 0.22, -g * 0.22, g * 0.5, Math.PI * 1.05, Math.PI * 1.45), p, g);
  },
  // 6 Lighthouse: a tapered tower with its lantern and two wide beams.
  6(ctx, g, p) {
    stroke(ctx, c => { c.moveTo(-g * 0.2, g * 0.7); c.lineTo(-g * 0.11, -g * 0.25); c.lineTo(g * 0.11, -g * 0.25); c.lineTo(g * 0.2, g * 0.7); }, p, g * 2.4);
    stroke(ctx, c => { c.rect(-g * 0.13, -g * 0.46, g * 0.26, g * 0.2); }, p, g);
    stroke(ctx, c => { c.moveTo(-g * 0.16, -g * 0.46); c.lineTo(0, -g * 0.6); c.lineTo(g * 0.16, -g * 0.46); }, p, g * 0.5);
    stroke(ctx, c => { c.moveTo(-g * 0.15, -g * 0.36); c.lineTo(-g * 0.85, -g * 0.55); c.moveTo(-g * 0.15, -g * 0.36); c.lineTo(-g * 0.85, -g * 0.18); }, p, g * 1.6);
    stroke(ctx, c => { c.moveTo(g * 0.15, -g * 0.36); c.lineTo(g * 0.85, -g * 0.55); c.moveTo(g * 0.15, -g * 0.36); c.lineTo(g * 0.85, -g * 0.18); }, p, g * 1.6);
    stroke(ctx, c => { c.moveTo(-g * 0.6, g * 0.7); c.lineTo(g * 0.6, g * 0.7); }, p, g * 1.2);
  },
  // 7 Skylark: a soaring bird of two curved wings, with lighter echoes rising.
  7(ctx, g, p) {
    stroke(ctx, c => { c.moveTo(-g * 0.75, -g * 0.05); c.quadraticCurveTo(-g * 0.35, -g * 0.4, 0, g * 0.12); c.quadraticCurveTo(g * 0.35, -g * 0.4, g * 0.75, -g * 0.05); }, p, g * 2.2);
    stroke(ctx, c => { c.moveTo(-g * 0.35, -g * 0.42); c.quadraticCurveTo(-g * 0.17, -g * 0.55, 0, -g * 0.36); c.quadraticCurveTo(g * 0.17, -g * 0.55, g * 0.35, -g * 0.42); }, p, g * 1.1);
    stroke(ctx, c => { c.moveTo(-g * 0.16, -g * 0.68); c.quadraticCurveTo(-g * 0.08, -g * 0.74, 0, -g * 0.64); c.quadraticCurveTo(g * 0.08, -g * 0.74, g * 0.16, -g * 0.68); }, p, g * 0.5);
    stroke(ctx, c => { c.moveTo(-g * 0.5, g * 0.5); c.quadraticCurveTo(0, g * 0.3, g * 0.5, g * 0.5); }, p, g * 1.1);
  },
  // 8 Monolith: a tall standing stone on firm ground, with a ring carved in it.
  8(ctx, g, p) {
    stroke(ctx, c => { c.moveTo(-g * 0.24, g * 0.62); c.lineTo(-g * 0.2, -g * 0.62); c.lineTo(0, -g * 0.74); c.lineTo(g * 0.2, -g * 0.62); c.lineTo(g * 0.24, g * 0.62); }, p, g * 3);
    stroke(ctx, c => c.arc(0, -g * 0.18, g * 0.1, 0, TAU), p, g * 0.7);
    stroke(ctx, c => { c.moveTo(-g * 0.78, g * 0.62); c.lineTo(g * 0.78, g * 0.62); }, p, g * 1.6);
    stroke(ctx, c => { c.moveTo(-g * 0.55, g * 0.74); c.lineTo(g * 0.55, g * 0.74); }, p, g * 1.1);
    stroke(ctx, c => { c.moveTo(-g * 0.3, g * 0.86); c.lineTo(g * 0.3, g * 0.86); }, p, g * 0.6);
  },
  // 9 Still Water: a full moon over calm water and its soft reflection.
  9(ctx, g, p) {
    stroke(ctx, c => c.arc(0, -g * 0.35, g * 0.22, 0, TAU), p, g * 1.4);
    [0.1, 0.28, 0.46].forEach((y, i) => stroke(ctx, c => { const w = g * (0.75 - i * 0.12); c.ellipse(0, g * y, w, g * 0.05, 0, 0, TAU); }, p, g * 3));
    stroke(ctx, c => { c.moveTo(-g * 0.08, g * 0.62); c.lineTo(g * 0.08, g * 0.62); }, p, g * 0.2);
  },
};

export function drawSigil(ctx, type, cx, cy, r, opts = {}) {
  const p = Math.max(0, Math.min(1, opts.progress == null ? 1 : opts.progress));
  const color = opts.color || "#cfeff0";
  const glow = opts.glow == null ? 1 : opts.glow;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineCap = "round"; ctx.lineJoin = "round";

  // soft halo
  const halo = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 1.25);
  halo.addColorStop(0, hexA(color, 0.22 * p * glow)); halo.addColorStop(0.55, hexA(color, 0.07 * p * glow)); halo.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, r * 1.25, 0, TAU); ctx.fill();

  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  // two passes: wide soft glow, then crisp line
  for (const pass of [0, 1]) {
    ctx.shadowBlur = pass === 0 ? r * 0.12 * glow : r * 0.035 * glow;
    ctx.globalAlpha = pass === 0 ? 0.55 : 1;
    ctx.lineWidth = pass === 0 ? Math.max(2, r * 0.03) : Math.max(1.2, r * 0.014);
    // rings
    stroke(ctx, c => c.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + TAU), p, r * 6.4);
    ctx.globalAlpha *= 0.45;
    stroke(ctx, c => c.arc(0, 0, r * 0.9, 0, TAU), p, r * 5.8);
    ctx.globalAlpha = pass === 0 ? 0.55 : 1;
    GLYPHS[type](ctx, r * 0.62, p);
  }
  // nine lights on the ring, starting at the top, clockwise
  ctx.shadowBlur = r * 0.06 * glow;
  for (let i = 1; i <= 9; i++) {
    const a = -Math.PI / 2 + ((i % 9) / 9) * TAU;
    const on = i === type, show = Math.min(1, Math.max(0, p * 1.4 - (i / 9) * 0.4));
    ctx.globalAlpha = show * (on ? 1 : 0.45);
    ctx.fillStyle = on ? "#ffffff" : color;
    ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, r * (on ? 0.035 : 0.018), 0, TAU); ctx.fill();
  }
  ctx.restore();
}

export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
}
