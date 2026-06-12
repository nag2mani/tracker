import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useMemo } from "react";
import { ME } from "../../lib/types";
import { shareOf } from "../../lib/splitwise";
import { isSameMonth, monthLabel, formatMoney } from "../../lib/utils";
import { useStore } from "../../store/store";
import { AnimatedMoney } from "../ui/AnimatedNumber";

export function HeroTotalCard() {
  const { data } = useStore();

  const { thisMonth, lastMonth, personalShare, groupShare } = useMemo(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    let thisMonth = 0;
    let lastMonth = 0;
    let personalShare = 0;
    let groupShare = 0;

    for (const e of data.expenses) {
      const mine = shareOf(e, ME);
      if (mine === 0) continue;
      if (isSameMonth(e.date, now)) {
        thisMonth += mine;
        if (e.type === "personal") personalShare += mine;
        else groupShare += mine;
      } else if (isSameMonth(e.date, prev)) {
        lastMonth += mine;
      }
    }
    return { thisMonth, lastMonth, personalShare, groupShare };
  }, [data.expenses]);

  const delta = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
  const up = delta >= 0;

  return (
    <div className="glass relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 sm:p-7">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl animate-pulse-glow" />
      <div className="pointer-events-none absolute -bottom-28 -left-10 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-300/20">
            <Wallet size={16} />
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-300">Your spending</p>
            <p className="text-xs text-zinc-500">{monthLabel()}</p>
          </div>
        </div>
        {lastMonth > 0 && (
          <span
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
              up
                ? "bg-rose-400/10 text-rose-300 ring-rose-300/20"
                : "bg-emerald-400/10 text-emerald-300 ring-emerald-300/20"
            }`}
          >
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(delta).toFixed(0)}%
          </span>
        )}
      </div>

      <div className="relative mt-6">
        <AnimatedMoney
          value={thisMonth}
          className="text-shimmer text-[2.6rem] leading-none font-bold tracking-tight sm:text-5xl"
        />
        <p className="mt-2 text-xs text-zinc-500">
          vs {formatMoney(Math.round(lastMonth))} last month
        </p>
      </div>

      <div className="relative mt-6">
        <div className="flex justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Personal · {formatMoney(Math.round(personalShare))}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
            Group share · {formatMoney(Math.round(groupShare))}
          </span>
        </div>
        <div className="mt-2.5 flex h-2 w-full gap-1 overflow-hidden rounded-full bg-white/[0.05]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${thisMonth > 0 ? (personalShare / thisMonth) * 100 : 0}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${thisMonth > 0 ? (groupShare / thisMonth) * 100 : 0}%` }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-300 shadow-[0_0_12px_rgba(167,139,250,0.5)]"
          />
        </div>
      </div>
    </div>
  );
}
