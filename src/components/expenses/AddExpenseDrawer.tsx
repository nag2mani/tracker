import { motion } from "framer-motion";
import { AlertCircle, Check, Equal, Percent, IndianRupee } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CATEGORIES,
  CATEGORY_META,
  ME,
  type Category,
  type SplitMethod,
} from "../../lib/types";
import { resolveSplits, validateSplits } from "../../lib/splitwise";
import { formatMoney, uid } from "../../lib/utils";
import { useStore } from "../../store/store";
import { Avatar } from "../ui/Avatar";
import { Drawer } from "../ui/Drawer";
import { CATEGORY_ICONS } from "../ui/CategoryIcon";

const SPLIT_METHODS: { key: SplitMethod; label: string; icon: typeof Equal }[] = [
  { key: "equal", label: "Equally", icon: Equal },
  { key: "exact", label: "Exact", icon: IndianRupee },
  { key: "percentage", label: "Percent", icon: Percent },
];

export function AddExpenseDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, dispatch, memberById } = useStore();

  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [category, setCategory] = useState<Category>("Dining");
  const [type, setType] = useState<"personal" | "group">("personal");
  const [groupId, setGroupId] = useState(data.groups[0]?.id ?? "");
  const [paidBy, setPaidBy] = useState(ME);
  const [method, setMethod] = useState<SplitMethod>("equal");
  const [participants, setParticipants] = useState<Set<string>>(
    () => new Set(data.groups[0]?.memberIds ?? []),
  );
  const [values, setValues] = useState<Record<string, number>>({});

  const amount = parseFloat(amountStr) || 0;
  const group = data.groups.find((g) => g.id === groupId);

  // switching groups re-syncs participants, payer and split values
  const selectGroup = (id: string) => {
    const next = data.groups.find((g) => g.id === id);
    if (!next) return;
    setGroupId(id);
    setParticipants(new Set(next.memberIds));
    setPaidBy(next.memberIds.includes(ME) ? ME : next.memberIds[0]);
    setValues({});
  };

  const participantIds = useMemo(
    () => group?.memberIds.filter((id) => participants.has(id)) ?? [],
    [group, participants],
  );

  const splitError =
    type === "group" ? validateSplits(method, amount, participantIds, values) : null;

  const valid =
    description.trim().length > 0 &&
    amount > 0 &&
    (type === "personal" || (!!group && !splitError));

  const reset = () => {
    setDescription("");
    setAmountStr("");
    setCategory("Dining");
    setType("personal");
    setMethod("equal");
    setValues({});
  };

  const submit = () => {
    if (!valid) return;
    dispatch({
      type: "ADD_EXPENSE",
      expense: {
        id: uid("exp"),
        description: description.trim(),
        amount,
        category,
        date: new Date().toISOString(),
        type,
        ...(type === "group" && group
          ? {
              groupId: group.id,
              paidBy,
              splitMethod: method,
              splits: resolveSplits(method, amount, participantIds, values),
            }
          : {}),
      },
    });
    reset();
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title="Add expense" subtitle="Track a bill in seconds" wide>
      <div className="flex flex-col gap-5">
        {/* type toggle */}
        <div className="flex rounded-2xl bg-white/[0.04] p-1 ring-1 ring-inset ring-white/[0.07]">
          {(["personal", "group"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`relative flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize transition-colors ${
                type === t ? "text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {type === t && (
                <motion.span
                  layoutId="expense-type-pill"
                  className="absolute inset-0 rounded-xl bg-white/[0.1] ring-1 ring-inset ring-white/[0.12]"
                  transition={{ type: "spring", damping: 30, stiffness: 380 }}
                />
              )}
              <span className="relative">{t}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dinner at Toit…"
            autoFocus
            className="glass-subtle h-11 rounded-xl px-3.5 text-sm outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-emerald-400/50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400">Amount</label>
          <div className="relative">
            <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-500">₹</span>
            <input
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="0"
              className="glass-subtle tabular h-12 w-full rounded-xl pr-3.5 pl-8 text-lg font-semibold outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-emerald-400/50"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICONS[c];
              const meta = CATEGORY_META[c];
              const selected = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ring-1 transition-all ring-inset active:scale-95 ${
                    selected
                      ? "text-zinc-50 ring-white/20"
                      : "bg-white/[0.03] text-zinc-400 ring-white/[0.06] hover:bg-white/[0.06]"
                  }`}
                  style={selected ? { background: meta.soft } : undefined}
                >
                  <Icon size={14} style={{ color: meta.color }} />
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {type === "group" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-col gap-5 overflow-hidden"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Group</label>
              <div className="flex flex-wrap gap-2">
                {data.groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => selectGroup(g.id)}
                    className={`rounded-full px-3.5 py-2 text-xs font-medium ring-1 transition-all ring-inset active:scale-95 ${
                      groupId === g.id
                        ? "bg-violet-400/15 text-violet-200 ring-violet-300/30"
                        : "bg-white/[0.04] text-zinc-400 ring-white/[0.08] hover:bg-white/[0.08]"
                    }`}
                  >
                    {g.emoji} {g.name}
                  </button>
                ))}
              </div>
            </div>

            {group && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">Paid by</label>
                  <div className="flex flex-wrap gap-2">
                    {group.memberIds.map((id) => {
                      const m = memberById.get(id);
                      if (!m) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => setPaidBy(id)}
                          className={`flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-xs font-medium ring-1 transition-all ring-inset active:scale-95 ${
                            paidBy === id
                              ? "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30"
                              : "bg-white/[0.04] text-zinc-400 ring-white/[0.08] hover:bg-white/[0.08]"
                          }`}
                        >
                          <Avatar member={m} size="sm" />
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">Split method</label>
                  <div className="flex rounded-2xl bg-white/[0.04] p-1 ring-1 ring-inset ring-white/[0.07]">
                    {SPLIT_METHODS.map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => {
                          setMethod(key);
                          setValues({});
                        }}
                        className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors ${
                          method === key ? "text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {method === key && (
                          <motion.span
                            layoutId="split-method-pill"
                            className="absolute inset-0 rounded-xl bg-white/[0.1] ring-1 ring-inset ring-white/[0.12]"
                            transition={{ type: "spring", damping: 30, stiffness: 380 }}
                          />
                        )}
                        <Icon size={12} className="relative" />
                        <span className="relative">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-400">Participants</label>
                  {group.memberIds.map((id) => {
                    const m = memberById.get(id);
                    if (!m) return null;
                    const included = participants.has(id);
                    const equalShare =
                      method === "equal" && included && participantIds.length > 0
                        ? amount / participantIds.length
                        : 0;
                    return (
                      <div
                        key={id}
                        className={`glass-subtle flex items-center gap-3 rounded-xl px-3 py-2.5 transition-opacity ${
                          included ? "" : "opacity-45"
                        }`}
                      >
                        <button
                          onClick={() =>
                            setParticipants((prev) => {
                              const next = new Set(prev);
                              if (next.has(id)) next.delete(id);
                              else next.add(id);
                              return next;
                            })
                          }
                          className={`flex h-5 w-5 items-center justify-center rounded-md ring-1 transition-all ring-inset ${
                            included
                              ? "bg-emerald-400/20 text-emerald-300 ring-emerald-300/40"
                              : "bg-white/[0.04] text-transparent ring-white/15"
                          }`}
                          aria-label={`Include ${m.name}`}
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>
                        <Avatar member={m} size="sm" />
                        <span className="flex-1 text-sm text-zinc-200">{m.name}</span>
                        {included && method === "equal" && (
                          <span className="tabular text-xs text-zinc-500">
                            {formatMoney(equalShare, true)}
                          </span>
                        )}
                        {included && method !== "equal" && (
                          <div className="relative w-24">
                            <input
                              value={values[id] ?? ""}
                              onChange={(e) =>
                                setValues((v) => ({
                                  ...v,
                                  [id]: parseFloat(e.target.value) || 0,
                                }))
                              }
                              inputMode="decimal"
                              placeholder="0"
                              className="tabular h-8 w-full rounded-lg bg-white/[0.05] pr-7 pl-2.5 text-right text-xs font-semibold ring-1 ring-inset ring-white/10 outline-none focus:ring-emerald-400/50"
                            />
                            <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[10px] text-zinc-500">
                              {method === "exact" ? "₹" : "%"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {splitError && amount > 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-xl bg-amber-400/10 px-3.5 py-2.5 text-xs font-medium text-amber-300 ring-1 ring-inset ring-amber-300/20"
                  >
                    <AlertCircle size={13} />
                    {splitError}
                  </motion.p>
                )}
              </>
            )}
          </motion.div>
        )}

        <button
          onClick={submit}
          disabled={!valid}
          className="mt-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-sm font-bold text-emerald-950 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.6)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {amount > 0 ? `Add ${formatMoney(amount)} expense` : "Add expense"}
        </button>
      </div>
    </Drawer>
  );
}
