import { motion } from "framer-motion";
import { Trash2, Users } from "lucide-react";
import { ME, type Expense } from "../../lib/types";
import { shareOf } from "../../lib/splitwise";
import { formatDate, formatMoney } from "../../lib/utils";
import { useStore } from "../../store/store";
import { CategoryIcon } from "../ui/CategoryIcon";

export function ExpenseRow({
  expense,
  onDelete,
}: {
  expense: Expense;
  onDelete?: (id: string) => void;
}) {
  const { groupById, memberById } = useStore();
  const group = expense.groupId ? groupById.get(expense.groupId) : undefined;
  const payer = expense.paidBy ? memberById.get(expense.paidBy) : undefined;
  const myShare = shareOf(expense, ME);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
      transition={{ type: "spring", damping: 26, stiffness: 300 }}
      className="group flex items-center gap-3.5 rounded-2xl px-3.5 py-3 transition-colors hover:bg-white/[0.04]"
    >
      <CategoryIcon category={expense.category} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">{expense.description}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span>{formatDate(expense.date)}</span>
          {group && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="flex items-center gap-1 text-violet-300/80">
                <Users size={10} />
                {group.emoji} {group.name}
              </span>
              {payer && (
                <>
                  <span className="text-zinc-700">·</span>
                  <span>{payer.id === ME ? "you paid" : `${payer.name} paid`}</span>
                </>
              )}
            </>
          )}
        </p>
      </div>

      <div className="text-right">
        <p className="tabular text-sm font-semibold text-zinc-100">
          {formatMoney(expense.amount)}
        </p>
        {expense.type === "group" && (
          <p className="tabular text-[11px] text-zinc-500">your share {formatMoney(myShare)}</p>
        )}
      </div>

      {onDelete && (
        <button
          onClick={() => onDelete(expense.id)}
          className="rounded-lg p-1.5 text-zinc-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-400/10 hover:text-rose-300"
          aria-label={`Delete ${expense.description}`}
        >
          <Trash2 size={14} />
        </button>
      )}
    </motion.li>
  );
}
