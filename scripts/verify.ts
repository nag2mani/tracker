/**
 * Sanity checks for the splitwise engine. Run with: npx tsx scripts/verify.ts
 */
import {
  computeBalances,
  resolveSplits,
  simplifyDebts,
  validateSplits,
} from "../src/lib/splitwise";
import { buildSeedData } from "../src/lib/seed";
import type { Expense } from "../src/lib/types";

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name}`, detail ?? "");
  }
}

console.log("\n— resolveSplits —");
const eq = resolveSplits("equal", 100, ["a", "b", "c"]);
check(
  "equal split of ₹100 across 3 sums exactly to 100",
  eq.reduce((s, x) => s + x.amount, 0) === 100,
  eq,
);
check("paise remainder spread (33.34 / 33.33 / 33.33)", eq[0].amount === 33.34 && eq[2].amount === 33.33, eq);

const pct = resolveSplits("percentage", 45000, ["me", "a", "p"], { me: 40, a: 35, p: 25 });
check(
  "percentage split 40/35/25 of ₹45,000",
  pct[0].amount === 18000 && pct[1].amount === 15750 && pct[2].amount === 11250,
  pct,
);

check(
  "exact validation flags shortfall",
  validateSplits("exact", 100, ["a", "b"], { a: 40, b: 40 }) !== null,
);
check(
  "percentage validation passes at 100%",
  validateSplits("percentage", 100, ["a", "b"], { a: 60, b: 40 }) === null,
);

console.log("\n— debt simplification —");
// A owes B 20, B owes C 20  =>  single payment A -> C 20
const chain: Expense[] = [
  {
    id: "1", description: "x", amount: 20, category: "Others", date: "2026-06-01",
    type: "group", groupId: "g", paidBy: "B", splitMethod: "exact",
    splits: [{ memberId: "A", amount: 20 }],
  },
  {
    id: "2", description: "y", amount: 20, category: "Others", date: "2026-06-01",
    type: "group", groupId: "g", paidBy: "C", splitMethod: "exact",
    splits: [{ memberId: "B", amount: 20 }],
  },
];
const chainBalances = computeBalances(chain, []);
const simplified = simplifyDebts(chainBalances);
check(
  "A→B→C chain collapses to single A→C ₹20",
  simplified.length === 1 &&
    simplified[0].from === "A" &&
    simplified[0].to === "C" &&
    simplified[0].amount === 20,
  simplified,
);

console.log("\n— seed data invariants —");
const seed = buildSeedData();
const balances = computeBalances(seed.expenses, seed.settlements);
const sum = [...balances.values()].reduce((s, v) => s + v, 0);
check("Σ balances ≈ 0", Math.abs(sum) < 0.01, sum);

for (const e of seed.expenses) {
  if (e.type !== "group") continue;
  const total = e.splits!.reduce((s, x) => s + x.amount, 0);
  if (Math.abs(total - e.amount) > 0.01) {
    check(`splits of "${e.description}" sum to amount`, false, { total, amount: e.amount });
  }
}
check("every group expense's splits sum to its amount", failures === 0);

const debts = simplifyDebts(balances);
const naivePairs = new Set<string>();
for (const e of seed.expenses) {
  if (e.type !== "group" || !e.paidBy) continue;
  for (const s of e.splits!) if (s.memberId !== e.paidBy) naivePairs.add(`${s.memberId}->${e.paidBy}`);
}
check(
  `simplified (${debts.length} payments) ≤ naive pairwise (${naivePairs.size})`,
  debts.length <= naivePairs.size,
);

// settling every simplified debt must zero everything out
const settleAll = debts.map((d, i) => ({
  id: `s${i}`, from: d.from, to: d.to, amount: d.amount, date: "2026-06-11",
}));
const after = computeBalances(seed.expenses, [...seed.settlements, ...settleAll]);
check(
  "paying all simplified debts zeroes every balance",
  [...after.values()].every((v) => Math.abs(v) < 0.01),
  Object.fromEntries(after),
);

console.log(failures === 0 ? "\nAll checks passed ✅\n" : `\n${failures} FAILURES ❌\n`);
process.exit(failures === 0 ? 0 : 1);
