import { motion } from "framer-motion";
import { ChartPie, ChartColumn } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORIES, CATEGORY_META, ME, type Category } from "../../lib/types";
import { shareOf } from "../../lib/splitwise";
import { formatMoney, isSameMonth } from "../../lib/utils";
import { useStore } from "../../store/store";
import { useFilters } from "../../store/filters";

type Mode = "donut" | "bars";

export function AnalyticsCard() {
  const { data } = useStore();
  const filters = useFilters();
  const [mode, setMode] = useState<Mode>("donut");
  const [active, setActive] = useState<Category | null>(null);

  const breakdown = useMemo(() => {
    const sums = new Map<Category, number>();
    for (const e of data.expenses) {
      if (!isSameMonth(e.date)) continue;
      if (!filters.matches(e)) continue;
      const mine = shareOf(e, ME);
      if (mine <= 0) continue;
      sums.set(e.category, (sums.get(e.category) ?? 0) + mine);
    }
    return CATEGORIES.filter((c) => (sums.get(c) ?? 0) > 0).map((c) => ({
      name: c,
      value: Math.round(sums.get(c)!),
      color: CATEGORY_META[c].color,
    }));
  }, [data.expenses, filters]);

  const total = breakdown.reduce((s, d) => s + d.value, 0);
  const activeEntry = breakdown.find((d) => d.name === active);

  return (
    <div className="glass relative flex flex-col overflow-hidden rounded-3xl p-6 sm:p-7">
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-300">Category breakdown</p>
          <p className="text-xs text-zinc-500">your share, this month</p>
        </div>
        <div className="flex rounded-full bg-white/[0.05] p-1 ring-1 ring-inset ring-white/[0.08]">
          {(
            [
              { key: "donut", icon: ChartPie },
              { key: "bars", icon: ChartColumn },
            ] as const
          ).map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`relative rounded-full p-1.5 transition-colors ${
                mode === key ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
              aria-label={key}
            >
              {mode === key && (
                <motion.span
                  layoutId="chart-mode"
                  className="absolute inset-0 rounded-full bg-white/[0.12]"
                  transition={{ type: "spring", damping: 28, stiffness: 350 }}
                />
              )}
              <Icon size={14} className="relative" />
            </button>
          ))}
        </div>
      </div>

      {breakdown.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-12 text-sm text-zinc-600">
          No expenses match the current filters
        </div>
      ) : (
        <>
          <div className="relative mt-2 h-52">
            {mode === "donut" ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {breakdown.map((d) => (
                        <filter key={d.name} id={`glow-${d.name}`}>
                          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={d.color} floodOpacity="0.55" />
                        </filter>
                      ))}
                    </defs>
                    <Pie
                      data={breakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="68%"
                      outerRadius="92%"
                      paddingAngle={3}
                      cornerRadius={6}
                      strokeWidth={0}
                      onMouseLeave={() => setActive(null)}
                    >
                      {breakdown.map((d) => (
                        <Cell
                          key={d.name}
                          fill={d.color}
                          opacity={active && active !== d.name ? 0.25 : 1}
                          filter={active === d.name ? `url(#glow-${d.name})` : undefined}
                          style={{ transition: "opacity 0.25s", cursor: "pointer" }}
                          onMouseEnter={() => setActive(d.name)}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={() => null} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <motion.p
                    key={activeEntry?.name ?? "total"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="tabular text-2xl font-bold tracking-tight"
                    style={{ color: activeEntry?.color ?? "#fafafa" }}
                  >
                    {formatMoney(activeEntry?.value ?? total)}
                  </motion.p>
                  <p className="text-[11px] font-medium text-zinc-500">
                    {activeEntry ? activeEntry.name : "Total"}
                  </p>
                </div>
              </>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#71717a", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: string) => v.slice(0, 4)}
                  />
                  <YAxis
                    tick={{ fill: "#52525b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    content={({ payload }) =>
                      payload?.[0] ? (
                        <div className="glass-raised rounded-xl px-3 py-2 text-xs">
                          <p className="font-semibold">{payload[0].payload.name}</p>
                          <p className="tabular text-zinc-300">
                            {formatMoney(payload[0].payload.value)}
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="value" radius={[6, 6, 2, 2]} maxBarSize={36}>
                    {breakdown.map((d) => (
                      <Cell key={d.name} fill={d.color} opacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="relative mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {breakdown.map((d) => (
              <button
                key={d.name}
                onMouseEnter={() => setActive(d.name)}
                onMouseLeave={() => setActive(null)}
                className={`flex items-center gap-1.5 text-[11px] font-medium transition-opacity ${
                  active && active !== d.name ? "opacity-40" : "opacity-100"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: d.color, boxShadow: `0 0 8px ${d.color}99` }}
                />
                <span className="text-zinc-400">{d.name}</span>
                <span className="tabular text-zinc-200">
                  {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
