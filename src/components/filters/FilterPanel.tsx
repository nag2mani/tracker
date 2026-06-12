import { motion } from "framer-motion";
import { FilterX, SlidersHorizontal, User, Users } from "lucide-react";
import { CATEGORIES, CATEGORY_META } from "../../lib/types";
import { useFilters, type TypeFilter } from "../../store/filters";
import { CATEGORY_ICONS } from "../ui/CategoryIcon";

const TYPE_OPTIONS: { key: TypeFilter; label: string; icon?: typeof User }[] = [
  { key: "all", label: "All" },
  { key: "personal", label: "Personal", icon: User },
  { key: "group", label: "Group", icon: Users },
];

export function FilterPanel() {
  const filters = useFilters();

  return (
    <aside className="glass sticky top-24 flex h-fit flex-col gap-5 rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <SlidersHorizontal size={14} className="text-zinc-400" />
          Filters
        </span>
        {filters.isActive && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={filters.clear}
            className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-zinc-300 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/[0.12] hover:text-zinc-100"
          >
            <FilterX size={11} />
            Clear
          </motion.button>
        )}
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Type</p>
        <div className="flex rounded-2xl bg-white/[0.04] p-1 ring-1 ring-inset ring-white/[0.07]">
          {TYPE_OPTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => filters.setType(key)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors ${
                filters.type === key ? "text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {filters.type === key && (
                <motion.span
                  layoutId="type-filter-pill"
                  className="absolute inset-0 rounded-xl bg-white/[0.1] shadow-[0_0_16px_rgba(255,255,255,0.06)] ring-1 ring-inset ring-white/[0.12]"
                  transition={{ type: "spring", damping: 30, stiffness: 380 }}
                />
              )}
              {Icon && <Icon size={12} className="relative" />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
          Category
        </p>
        <div className="flex flex-col gap-1.5">
          {CATEGORIES.map((cat) => {
            const selected = filters.categories.has(cat);
            const meta = CATEGORY_META[cat];
            const Icon = CATEGORY_ICONS[cat];
            return (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.97 }}
                onClick={() => filters.toggleCategory(cat)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium ring-1 transition-all duration-200 ring-inset ${
                  selected
                    ? "text-zinc-50 ring-white/[0.14]"
                    : "text-zinc-400 ring-transparent hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
                style={selected ? { background: meta.soft } : undefined}
              >
                <Icon size={14} style={{ color: meta.color }} />
                <span className="flex-1">{cat}</span>
                <span
                  className={`h-2 w-2 rounded-full transition-all duration-200 ${
                    selected ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  }`}
                  style={{ background: meta.color, boxShadow: `0 0 10px ${meta.color}` }}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
