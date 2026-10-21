// "Compare with a friend" texts, built from each type's traits in data.js.
// 36 different-type pairs + 9 same-type pairs, all from templates (edit the templates below).
import { TYPES } from "./data.js";

const TOGETHER = [
  "Together you {va} and {vb}, a combination that gets things done and still feels good.",
  "Side by side, one of you helps the pair {va} while the other helps you both {vb}.",
  "You balance each other: when one of you needs to {va}, the other remembers to {vb}.",
  "On a long journey you'd make a good crew: one helps you {va}, the other helps you {vb}.",
];
const BRIDGE = [
  "slow down and say out loud what each of you needs.",
  "remember you're on the same side, just walking at different speeds.",
  "take a short break and come back with curiosity instead of conclusions.",
  "ask one honest question before giving any answers.",
];

export function pairing(a, b) {
  const A = TYPES[a], B = TYPES[b];
  if (a === b) {
    return {
      title: `${A.name} + ${B.name}`,
      lines: [
        `Two of a kind. You understand each other almost without words, because you both bring ${A.gift}.`,
        `You can ${A.verb} together faster than anyone else.`,
        `Watch for: your ${A.friction} doubling up. ${A.same}`,
      ],
    };
  }
  const [x, y] = a < b ? [A, B] : [B, A];
  const k = (Math.min(a, b) * 7 + Math.max(a, b) * 3) % 4;
  return {
    title: `${A.name} + ${B.name}`,
    lines: [
      `${x.name} brings ${x.gift}. ${y.name} brings ${y.gift}.`,
      TOGETHER[k].replace("{va}", x.verb).replace("{vb}", y.verb),
      `Watch for: ${x.friction} meeting ${y.friction}. When it happens, ${BRIDGE[(k + 1) % 4]}`,
    ],
  };
}
