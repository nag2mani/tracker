import { ArrowDownLeft, ArrowUpRight, HandCoins, Scale } from "lucide-react";
import { useMemo } from "react";
import { ME } from "../../lib/types";
import { computeBalances, simplifyDebts } from "../../lib/splitwise";
import { formatMoney } from "../../lib/utils";
import { useStore } from "../../store/store";
import { AnimatedMoney } from "../ui/AnimatedNumber";
import { Avatar } from "../ui/Avatar";

export function NetBalanceCard({ onSettleUp }: { onSettleUp: () => void }) {
  const { data, memberById } = useStore();

  const { net, owedToMe, iOwe } = useMemo(() => {
    const balances = computeBalances(data.expenses, data.settlements);
    const debts = simplifyDebts(balances);
    return {
      net: balances.get(ME) ?? 0,
      owedToMe: debts.filter((d) => d.to === ME),
      iOwe: debts.filter((d) => d.from === ME),
    };
  }, [data.expenses, data.settlements]);

  const positive = net >= 0;
  const hasDebts = owedToMe.length > 0 || iOwe.length > 0;

  return (
    <div className="glass relative flex flex-col overflow-hidden rounded-3xl p-6 sm:p-7">
      <div
        className={`pointer-events-none absolute -top-20 -left-16 h-56 w-56 rounded-full blur-3xl ${
          positive ? "bg-emerald-500/12" : "bg-rose-500/12"
        }`}
      />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/15 text-violet-300 ring-1 ring-inset ring-violet-300/20">
            <Scale size={16} />
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-300">Net balance</p>
            <p className="text-xs text-zinc-500">across all groups</p>
          </div>
        </div>
        <button
          onClick={onSettleUp}
          disabled={!hasDebts}
          className="flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-xs font-semibold text-zinc-200 ring-1 ring-inset ring-white/10 transition-all hover:bg-white/[0.14] hover:ring-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <HandCoins size={13} />
          Settle up
        </button>
      </div>

      <div className="relative mt-5">
        <AnimatedMoney
          value={Math.abs(net)}
          precise
          className={`text-4xl font-bold tracking-tight ${
            positive
              ? "text-emerald-300 drop-shadow-[0_0_18px_rgba(52,211,153,0.35)]"
              : "text-rose-300 drop-shadow-[0_0_18px_rgba(251,113,133,0.35)]"
          }`}
        />
        <p className="mt-1 text-xs font-medium text-zinc-500">
          {positive ? "you are owed overall" : "you owe overall"}
        </p>
      </div>

      <div className="relative mt-5 grid flex-1 grid-cols-2 gap-3">
        <BalanceColumn
          title="Owes you"
          icon={<ArrowDownLeft size={12} />}
          tone="positive"
          rows={owedToMe.map((d) => ({ id: d.from, amount: d.amount }))}
          memberName={(id) => memberById.get(id)}
        />
        <BalanceColumn
          title="You owe"
          icon={<ArrowUpRight size={12} />}
          tone="negative"
          rows={iOwe.map((d) => ({ id: d.to, amount: d.amount }))}
          memberName={(id) => memberById.get(id)}
        />
      </div>
    </div>
  );
}

function BalanceColumn({
  title,
  icon,
  tone,
  rows,
  memberName,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "positive" | "negative";
  rows: { id: string; amount: number }[];
  memberName: (id: string) => { id: string; name: string; color: string } | undefined;
}) {
  const accent =
    tone === "positive"
      ? "text-emerald-300 bg-emerald-400/10 ring-emerald-300/15"
      : "text-rose-300 bg-rose-400/10 ring-rose-300/15";

  return (
    <div className="glass-subtle flex flex-col gap-2 rounded-2xl p-3.5">
      <span
        className={`flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ring-1 ring-inset ${accent}`}
      >
        {icon}
        {title}
      </span>
      {rows.length === 0 ? (
        <p className="py-2 text-center text-xs text-zinc-600">All clear ✨</p>
      ) : (
        rows.map((row) => {
          const m = memberName(row.id);
          if (!m) return null;
          return (
            <div key={row.id} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <Avatar member={m} size="sm" />
                <span className="truncate text-xs font-medium text-zinc-300">{m.name}</span>
              </span>
              <span
                className={`tabular shrink-0 text-xs font-bold ${
                  tone === "positive" ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {formatMoney(row.amount)}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
