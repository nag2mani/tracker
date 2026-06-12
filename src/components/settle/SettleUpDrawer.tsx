import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, PartyPopper } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { computeBalances, simplifyDebts } from "../../lib/splitwise";
import { ME, type SimplifiedDebt } from "../../lib/types";
import { formatMoney, uid } from "../../lib/utils";
import { useStore } from "../../store/store";
import { Avatar } from "../ui/Avatar";
import { Confetti } from "../ui/Confetti";
import { Drawer } from "../ui/Drawer";

export function SettleUpDrawer({
  open,
  groupId,
  onClose,
}: {
  open: boolean;
  groupId?: string;
  onClose: () => void;
}) {
  const { data, dispatch, memberById, groupById } = useStore();
  const [celebrating, setCelebrating] = useState(false);
  const [justSettled, setJustSettled] = useState<string | null>(null);

  const debts = useMemo(() => {
    const balances = computeBalances(data.expenses, data.settlements, groupId);
    return simplifyDebts(balances);
  }, [data.expenses, data.settlements, groupId]);

  // burst confetti briefly, then clean up
  useEffect(() => {
    if (!celebrating) return;
    const t = setTimeout(() => setCelebrating(false), 3200);
    return () => clearTimeout(t);
  }, [celebrating]);

  // clear the celebration flag after the exit animation finishes
  const handleClose = () => {
    onClose();
    setTimeout(() => setJustSettled(null), 400);
  };

  const settle = (debt: SimplifiedDebt) => {
    dispatch({
      type: "ADD_SETTLEMENT",
      settlement: {
        id: uid("set"),
        from: debt.from,
        to: debt.to,
        amount: debt.amount,
        date: new Date().toISOString(),
        groupId,
      },
    });
    setJustSettled(`${debt.from}→${debt.to}`);
    setCelebrating(true);
  };

  const groupName = groupId ? groupById.get(groupId)?.name : undefined;

  return (
    <>
      {celebrating && <Confetti />}
      <Drawer
        open={open}
        onClose={handleClose}
        title="Settle up"
        subtitle={groupName ? `in ${groupName}` : "across all groups — fewest possible payments"}
      >
        {debts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20 }}
            className="flex flex-col items-center gap-4 py-16 text-center"
          >
            <motion.span
              initial={{ rotate: -12, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", damping: 12, delay: 0.1 }}
              className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-300/25 shadow-[0_0_40px_-4px_rgba(52,211,153,0.4)]"
            >
              {justSettled ? <PartyPopper size={26} /> : <CheckCircle2 size={26} />}
            </motion.span>
            <div>
              <p className="text-base font-semibold text-zinc-100">
                {justSettled ? "All settled — nice!" : "Nothing to settle"}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Every balance is at zero. Go split something. ✌️
              </p>
            </div>
          </motion.div>
        ) : (
          <ul className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {debts.map((debt, i) => {
                const from = memberById.get(debt.from);
                const to = memberById.get(debt.to);
                if (!from || !to) return null;
                const involvesMe = debt.from === ME || debt.to === ME;
                return (
                  <motion.li
                    key={`${debt.from}-${debt.to}-${debt.amount}`}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", damping: 26, stiffness: 300, delay: i * 0.04 }}
                    className={`glass-subtle rounded-2xl p-4 ${
                      involvesMe ? "ring-1 ring-inset ring-violet-300/15" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar member={from} />
                      <div className="flex flex-1 flex-col items-center">
                        <span className="tabular text-sm font-bold text-zinc-100">
                          {formatMoney(debt.amount)}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                          {from.id === ME ? "you pay" : `${from.name} pays`}
                          <ArrowRight size={10} />
                          {to.id === ME ? "you" : to.name}
                        </span>
                      </div>
                      <Avatar member={to} />
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => settle(debt)}
                      className="mt-3.5 w-full rounded-xl bg-gradient-to-r from-emerald-500/90 to-emerald-400/90 py-2.5 text-xs font-bold text-emerald-950 shadow-[0_6px_20px_-6px_rgba(16,185,129,0.55)] transition-all hover:brightness-110"
                    >
                      Mark as paid
                    </motion.button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </Drawer>
    </>
  );
}
