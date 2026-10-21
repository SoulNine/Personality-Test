// Balance check + simulation for the quiz. Run: npm run check  (writes tools/sim_results.md)
import { writeFileSync } from "node:fs";
import { QUESTIONS, TYPES, NEIGHBOURS } from "../js/data.js";
import { score, maxPoints, encode, decode } from "../js/scoring.js";

let fails = 0;
const check = (msg, ok) => { console.log((ok ? "PASS " : "FAIL ") + msg); if (!ok) fails++; };
const T = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// ---------- structural checks ----------
check(`10 questions (${QUESTIONS.length})`, QUESTIONS.length === 10);
const prim = {}, sec = {}, expected = {};
T.forEach(t => { prim[t] = 0; sec[t] = 0; expected[t] = 0; });
for (const q of QUESTIONS) {
  const seen = new Set();
  for (const [text, p, s] of q.options) {
    if (p === s || seen.has(p) || seen.has(s)) check(`${q.id}: a type appears twice ("${text}")`, false);
    seen.add(p); seen.add(s); prim[p]++; sec[s]++;
    expected[p] += 2 / q.options.length; expected[s] += 1 / q.options.length;
  }
}
check("every type is primary in 4 options: " + JSON.stringify(prim), T.every(t => prim[t] === 4));
check("every type is secondary in 4 options: " + JSON.stringify(sec), T.every(t => sec[t] === 4));
const mx = maxPoints();
check("max possible points equal for all types: " + mx.join(","), mx.every(v => v === mx[0]));
const ev = T.map(t => expected[t].toFixed(4));
check("expected points of a random player equal for all types: " + ev.join(","), new Set(ev).size === 1);
check("no type appears twice in one question", true);
check("codes round-trip", T.every(t => NEIGHBOURS[t].every(w => { const d = decode(encode(t, w)); return d && d.core === t && d.wing === w; })) && decode("6w3").wing === null && decode("6").core === 6 && decode("x") === null);
check("all 9 types have texts", T.every(t => TYPES[t] && TYPES[t].core.length === 3));

// ---------- simulation ----------
let seed = 20261020;
const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pick = n => Math.floor(rng() * n);
const weight = (o, t) => (o[1] === t ? 2 : o[2] === t ? 1 : 0);

function play(strategy) { return QUESTIONS.map(q => strategy(q)); }
const random = q => pick(q.options.length);
const pure = (type, c) => q => {
  const best = q.options.map(o => weight(o, type));
  const m = Math.max(...best);
  if (m > 0 && rng() < c) { const idx = best.map((v, i) => v === m ? i : -1).filter(i => i >= 0); return idx[pick(idx.length)]; }
  return random(q);
};
const withWing = (type, wing, c) => q => {
  const v = q.options.map(o => weight(o, type) + 0.5 * weight(o, wing));
  const m = Math.max(...v);
  if (m > 0 && rng() < c) { const idx = v.map((x, i) => x === m ? i : -1).filter(i => i >= 0); return idx[pick(idx.length)]; }
  return random(q);
};

const N = 100000, out = [];
const pct = x => (100 * x).toFixed(1) + "%";
// random players
const dist = {}; T.forEach(t => dist[t] = 0); let close = 0;
for (let i = 0; i < N; i++) { const r = score(play(random), rng); dist[r.core]++; if (r.closeCall) close++; }
out.push(`## Random players (${N.toLocaleString("en")})`, "", "| Type | Share of results |", "|---|---|",
  ...T.map(t => `| ${t} ${TYPES[t].name} | ${pct(dist[t] / N)} |`), "", `Tied top score (close call): ${pct(close / N)}`, "");
const spread = Math.max(...T.map(t => dist[t])) / N - Math.min(...T.map(t => dist[t])) / N;
check(`random players spread max-min = ${pct(spread)} (want < 1.5 pp)`, spread < 0.015);

// exact distribution over ALL answer combinations (ties shared equally = random tie-break)
{
  const sizes = QUESTIONS.map(q => q.options.length), share = Array(10).fill(0);
  let combos = 0; const a = Array(10).fill(0);
  const rec = (qi, pts) => {
    if (qi === QUESTIONS.length) {
      let m = -1, top = [];
      for (let t = 1; t <= 9; t++) { if (pts[t] > m) { m = pts[t]; top = [t]; } else if (pts[t] === m) top.push(t); }
      top.forEach(t => share[t] += 1 / top.length); combos++; return;
    }
    for (const [, p, s] of QUESTIONS[qi].options) { pts[p] += 2; pts[s] += 1; rec(qi + 1, pts); pts[p] -= 2; pts[s] -= 1; }
  };
  rec(0, Array(10).fill(0));
  const ex = T.map(t => 100 * share[t] / combos);
  out.push(`## Exact: every possible answer combination (${combos.toLocaleString("en")}), random tie-break`, "",
    "| Type | Share of results |", "|---|---|", ...T.map((t, i) => `| ${t} ${TYPES[t].name} | ${ex[i].toFixed(2)}% |`), "",
    `Range ${Math.min(...ex).toFixed(2)}% - ${Math.max(...ex).toFixed(2)}% (perfectly even would be 11.11%).`, "");
  check(`exact spread ${(Math.max(...ex) - Math.min(...ex)).toFixed(2)} pp (want < 1 pp)`, Math.max(...ex) - Math.min(...ex) < 1);
}

// pure-type players
out.push("## Players who answer like one type", "", "Consistency = chance they pick their own type's best option when the question has one (otherwise random).", "",
  "| Consistency | Correct type (mean) | Worst type | Close calls |", "|---|---|---|---|");
for (const c of [1, 0.8, 0.6, 0.4]) {
  const per = []; let cc = 0;
  for (const t of T) { let ok = 0; for (let i = 0; i < 20000; i++) { const r = score(play(pure(t, c)), rng); if (r.core === t) ok++; if (r.closeCall) cc++; } per.push(ok / 20000); }
  out.push(`| ${c} | ${pct(per.reduce((a, b) => a + b) / 9)} | ${pct(Math.min(...per))} | ${pct(cc / (9 * 20000))} |`);
}
out.push("");
// type + wing
let coreOk = 0, bothOk = 0, n = 0;
for (const t of T) for (const w of NEIGHBOURS[t]) for (let i = 0; i < 10000; i++) {
  const r = score(play(withWing(t, w, 0.8)), rng); n++;
  if (r.core === t) { coreOk++; if (r.wing === w) bothOk++; }
}
out.push("## Players with a type and a wing (consistency 0.8, wing counted half)", "",
  `Correct type: ${pct(coreOk / n)} · correct type and wing: ${pct(bothOk / n)} · wing right when type right: ${pct(bothOk / coreOk)}`, "");

const md = ["# Soul Nine quiz: balance check and simulation", "", `Generated by tools/check.mjs (seed 20261020). ${fails ? "SOME CHECKS FAILED" : "All structural checks passed."}`, "",
  "Structure: 10 questions (6 with 4 options, 4 with 3 options). Every option gives its primary type +2 and its secondary type +1.",
  "Each type is primary 4 times and secondary 4 times, appears at most once per question (max 12 points for every type),",
  "and a player answering at random has the same expected score for every type (10/3 points).", "", ...out].join("\n");
writeFileSync(new URL("./sim_results.md", import.meta.url), md + "\n");
console.log("\n" + out.join("\n"));
process.exit(fails ? 1 : 0);
