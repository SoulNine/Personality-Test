// Soul Nine quiz scoring (shared by the site and tools/check.mjs).
import { QUESTIONS, NEIGHBOURS } from "./data.js";

export const PRIMARY = 2, SECONDARY = 1;

// answers: array of option indexes (original order, not screen order), one per question.
// rng: () => number in [0,1) used ONLY to break exact ties.
export function score(answers, rng = Math.random) {
  const pts = Array(10).fill(0);
  answers.forEach((a, qi) => {
    if (a == null || a < 0) return;
    const [, p, s] = QUESTIONS[qi].options[a];
    pts[p] += PRIMARY; pts[s] += SECONDARY;
  });
  const total = pts.reduce((x, y) => x + y, 0) || 1;
  const percent = {};
  for (let t = 1; t <= 9; t++) percent[t] = (100 * pts[t]) / total;

  // Core: highest points; exact ties are broken at random (like the game). A tie-break on
  // "more primary picks" was tested and made the results less even (see tools/check.mjs).
  const jitter = {}; for (let t = 1; t <= 9; t++) jitter[t] = rng();
  const order = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort((a, b) => pts[b] - pts[a] || jitter[a] - jitter[b]);
  const core = order[0], runnerUp = order[1];
  const closeCall = pts[core] === pts[runnerUp];   // one point = 3.3 pp, so "close" means tied points

  // Wing: the higher neighbour; equal -> random (balancedWing = true).
  const [a, b] = NEIGHBOURS[core];
  const wing = pts[a] !== pts[b] ? (pts[a] > pts[b] ? a : b) : (jitter[a] < jitter[b] ? a : b);
  const balancedWing = pts[a] === pts[b];
  return { core, wing, runnerUp, closeCall, balancedWing, points: pts.slice(1), percent };
}

// Short code used in links: "6w5".
export function encode(core, wing) { return `${core}w${wing}`; }
// Accepts "6w5" or just "6" (wing unknown -> null). Anything else -> null.
export function decode(code) {
  const m = /^([1-9])(?:w([1-9]))?$/.exec(String(code || "").trim());
  if (!m) return null;
  const core = +m[1], wing = m[2] ? +m[2] : null;
  if (wing !== null && !NEIGHBOURS[core].includes(wing)) return { core, wing: null };
  return { core, wing };
}

// Max points each type can get (equal for all types by design).
export function maxPoints() {
  const m = Array(10).fill(0);
  for (const q of QUESTIONS) for (let t = 1; t <= 9; t++)
    m[t] += Math.max(0, ...q.options.map(([, p, s]) => (p === t ? PRIMARY : s === t ? SECONDARY : 0)));
  return m.slice(1);
}
