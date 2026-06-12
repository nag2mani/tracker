import { AnimatePresence } from "framer-motion";
import { Receipt } from "lucide-react";
import { useStore } from "../../store/store";
import { useFilters } from "../../store/filters";
import { ExpenseRow } from "../expenses/ExpenseRow";

export function RecentActivity() {
  const { data, dispatch } = useStore();
  const filters = useFilters();

  const recent = data.expenses
    .filter(filters.matches)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 6);

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="mb-2 flex items-center gap-2.5 px-1.5">
        <Receipt size={15} className="text-zinc-400" />
        <p className="text-sm font-medium text-zinc-300">Recent activity</p>
      </div>
      {recent.length === 0 ? (
        <p className="px-1.5 py-8 text-center text-sm text-zinc-600">
          Nothing matches the current filters
        </p>
      ) : (
        <ul className="flex flex-col">
          <AnimatePresence mode="popLayout">
            {recent.map((e) => (
              <ExpenseRow
                key={e.id}
                expense={e}
                onDelete={(id) => dispatch({ type: "DELETE_EXPENSE", id })}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
