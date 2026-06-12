import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { ME } from "../lib/types";
import { shareOf } from "../lib/splitwise";
import { formatMoney } from "../lib/utils";
import { useFilters } from "../store/filters";
import { useStore } from "../store/store";
import { FilterPanel } from "../components/filters/FilterPanel";
import { ExpenseRow } from "../components/expenses/ExpenseRow";

export function ExpensesView() {
  const { data, dispatch } = useStore();
  const filters = useFilters();

  const filtered = useMemo(
    () =>
      data.expenses
        .filter(filters.matches)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [data.expenses, filters],
  );

  const totalShare = filtered.reduce((s, e) => s + shareOf(e, ME), 0);

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[230px_1fr]">
      <FilterPanel />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        className="glass rounded-3xl p-5 sm:p-6"
      >
        <div className="mb-3 flex items-baseline justify-between px-1.5">
          <p className="text-sm font-medium text-zinc-300">
            {filtered.length} expense{filtered.length === 1 ? "" : "s"}
          </p>
          <motion.p
            key={Math.round(totalShare)}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className="tabular text-sm font-semibold text-zinc-100"
          >
            your total {formatMoney(Math.round(totalShare))}
          </motion.p>
        </div>

        {filtered.length === 0 ? (
          <p className="py-14 text-center text-sm text-zinc-600">
            No expenses match — try clearing a filter
          </p>
        ) : (
          <ul className="flex flex-col">
            <AnimatePresence mode="popLayout">
              {filtered.map((e) => (
                <ExpenseRow
                  key={e.id}
                  expense={e}
                  onDelete={(id) => dispatch({ type: "DELETE_EXPENSE", id })}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </motion.div>
    </div>
  );
}
