import { AnimatePresence, motion } from "framer-motion";
import { Gem, LayoutDashboard, Plus, ReceiptText, RotateCcw, UsersRound } from "lucide-react";
import { useState } from "react";
import { AddExpenseDrawer } from "./components/expenses/AddExpenseDrawer";
import { SettleUpDrawer } from "./components/settle/SettleUpDrawer";
import { FilterProvider } from "./store/filters";
import { StoreProvider, useStore } from "./store/store";
import { DashboardView } from "./views/DashboardView";
import { ExpensesView } from "./views/ExpensesView";
import { GroupsView } from "./views/GroupsView";

type Tab = "dashboard" | "expenses" | "groups";

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "expenses", label: "Expenses", icon: ReceiptText },
  { key: "groups", label: "Groups", icon: UsersRound },
];

function Shell() {
  const { dispatch } = useStore();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [adding, setAdding] = useState(false);
  const [settling, setSettling] = useState<{ open: boolean; groupId?: string }>({
    open: false,
  });

  const openSettle = (groupId?: string) => setSettling({ open: true, groupId });

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 pb-16 sm:px-6">
      {/* ---------- header ---------- */}
      <header className="sticky top-0 z-40 -mx-4 mb-6 px-4 pt-4 pb-3 sm:-mx-6 sm:px-6">
        <div className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-emerald-400 shadow-[0_0_20px_-2px_rgba(139,92,246,0.5)]">
              <Gem size={15} className="text-white" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">Lumina</p>
              <p className="hidden text-[10px] text-zinc-500 sm:block">track & split, beautifully</p>
            </div>
          </div>

          <nav className="flex rounded-full bg-white/[0.04] p-1 ring-1 ring-inset ring-white/[0.07]">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 ${
                  tab === key ? "text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab === key && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-white/[0.1] shadow-[0_0_18px_rgba(255,255,255,0.07)] ring-1 ring-inset ring-white/[0.12]"
                    transition={{ type: "spring", damping: 30, stiffness: 380 }}
                  />
                )}
                <Icon size={13} className="relative" />
                <span className="relative hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch({ type: "RESET" })}
              title="Reset demo data"
              className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/[0.08] hover:text-zinc-200"
            >
              <RotateCcw size={14} />
            </button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-3.5 py-2 text-xs font-bold text-emerald-950 shadow-[0_6px_20px_-6px_rgba(16,185,129,0.7)] transition-all hover:brightness-110 sm:px-4"
            >
              <Plus size={14} strokeWidth={3} />
              <span className="hidden sm:inline">Add expense</span>
              <span className="sm:hidden">Add</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* ---------- animated views ---------- */}
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.16 } }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            {tab === "dashboard" && <DashboardView onSettleUp={() => openSettle()} />}
            {tab === "expenses" && <ExpensesView />}
            {tab === "groups" && <GroupsView onSettleUp={openSettle} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ---------- drawers ---------- */}
      <AddExpenseDrawer open={adding} onClose={() => setAdding(false)} />
      <SettleUpDrawer
        open={settling.open}
        groupId={settling.groupId}
        onClose={() => setSettling({ open: false })}
      />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <FilterProvider>
        <Shell />
      </FilterProvider>
    </StoreProvider>
  );
}
