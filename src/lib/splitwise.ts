import type {
  Expense,
  Settlement,
  SimplifiedDebt,
  Split,
  SplitMethod,
} from "./types";
import { round2 } from "./utils";

/**
 * Net balance per member across a set of expenses and settlements.
 * Positive  => the member is owed money (creditor).
 * Negative  => the member owes money (debtor).
 * Invariant: Σ balances ≈ 0.
 */
export function computeBalances(
  expenses: Expense[],
  settlements: Settlement[],
  groupId?: string,
): Map<string, number> {
  const balances = new Map<string, number>();
  const add = (id: string, delta: number) =>
    balances.set(id, (balances.get(id) ?? 0) + delta);

  for (const e of expenses) {
    if (e.type !== "group" || !e.paidBy || !e.splits) continue;
    if (groupId && e.groupId !== groupId) continue;
    add(e.paidBy, e.amount);
    for (const s of e.splits) add(s.memberId, -s.amount);
  }

  for (const s of settlements) {
    if (groupId && s.groupId !== groupId) continue;
    // Paying a debt raises your balance and lowers the receiver's claim.
    add(s.from, s.amount);
    add(s.to, -s.amount);
  }

  for (const [id, v] of balances) balances.set(id, round2(v));
  return balances;
}

/**
 * Transaction minimization: collapse the web of who-paid-what into the
 * fewest direct payments using a greedy max-creditor / max-debtor match.
 * If A owes B ₹20 and B owes C ₹20, the result is a single A → C ₹20.
 */
export function simplifyDebts(balances: Map<string, number>): SimplifiedDebt[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, balance] of balances) {
    if (balance > 0.005) creditors.push({ id, amount: balance });
    else if (balance < -0.005) debtors.push({ id, amount: -balance });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const result: SimplifiedDebt[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const transfer = round2(Math.min(creditor.amount, debtor.amount));

    if (transfer > 0.005) {
      result.push({ from: debtor.id, to: creditor.id, amount: transfer });
    }

    creditor.amount = round2(creditor.amount - transfer);
    debtor.amount = round2(debtor.amount - transfer);

    if (creditor.amount <= 0.005) ci++;
    if (debtor.amount <= 0.005) di++;
  }

  return result;
}

/**
 * Resolve raw split inputs into exact per-member amounts.
 * - equal:      amount divided evenly, paise remainder spread across the
 *               first members so the total always matches exactly.
 * - exact:      values are absolute amounts (must already sum to total).
 * - percentage: values are percentages of the total (must sum to 100).
 */
export function resolveSplits(
  method: SplitMethod,
  amount: number,
  memberIds: string[],
  values?: Record<string, number>,
): Split[] {
  if (memberIds.length === 0) return [];

  if (method === "equal") {
    const paise = Math.round(amount * 100);
    const base = Math.floor(paise / memberIds.length);
    let remainder = paise - base * memberIds.length;
    return memberIds.map((memberId) => {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      return { memberId, amount: (base + extra) / 100 };
    });
  }

  if (method === "exact") {
    return memberIds.map((memberId) => ({
      memberId,
      amount: round2(values?.[memberId] ?? 0),
    }));
  }

  // percentage
  return memberIds.map((memberId) => ({
    memberId,
    amount: round2((amount * (values?.[memberId] ?? 0)) / 100),
  }));
}

/** Validate raw split inputs; returns an error message or null when valid. */
export function validateSplits(
  method: SplitMethod,
  amount: number,
  memberIds: string[],
  values: Record<string, number>,
): string | null {
  if (memberIds.length === 0) return "Select at least one participant";
  if (method === "equal") return null;

  const total = memberIds.reduce((sum, id) => sum + (values[id] ?? 0), 0);

  if (method === "exact") {
    const diff = round2(total - amount);
    if (Math.abs(diff) > 0.01) {
      return diff > 0
        ? `Splits exceed the bill by ₹${Math.abs(diff).toFixed(2)}`
        : `₹${Math.abs(diff).toFixed(2)} left to assign`;
    }
    return null;
  }

  const diff = round2(total - 100);
  if (Math.abs(diff) > 0.01) {
    return diff > 0
      ? `Percentages exceed 100% by ${Math.abs(diff).toFixed(1)}%`
      : `${Math.abs(diff).toFixed(1)}% left to assign`;
  }
  return null;
}

/** How much of a group expense lands on "me" (or any member). */
export function shareOf(expense: Expense, memberId: string): number {
  if (expense.type === "personal") return memberId === "me" ? expense.amount : 0;
  return expense.splits?.find((s) => s.memberId === memberId)?.amount ?? 0;
}
