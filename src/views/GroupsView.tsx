import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Plus, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { ME, type Group } from "../lib/types";
import { computeBalances, simplifyDebts } from "../lib/splitwise";
import { formatMoney, uid } from "../lib/utils";
import { useStore } from "../store/store";
import { Avatar, AvatarStack } from "../components/ui/Avatar";
import { Drawer } from "../components/ui/Drawer";
import { ExpenseRow } from "../components/expenses/ExpenseRow";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, damping: 26, stiffness: 260 },
  },
};

const MEMBER_COLORS = ["#8b5cf6", "#f472b6", "#38bdf8", "#fbbf24", "#fb7185", "#34d399"];

export function GroupsView({ onSettleUp }: { onSettleUp: (groupId?: string) => void }) {
  const { data } = useStore();
  const [selected, setSelected] = useState<Group | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {data.groups.map((group) => (
          <motion.div key={group.id} variants={item}>
            <GroupCard group={group} onOpen={() => setSelected(group)} />
          </motion.div>
        ))}

        <motion.button
          variants={item}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => setCreating(true)}
          className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/[0.12] text-zinc-500 transition-colors hover:border-white/25 hover:bg-white/[0.03] hover:text-zinc-300"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-inset ring-white/10">
            <Plus size={18} />
          </span>
          <span className="text-sm font-medium">New group</span>
        </motion.button>
      </motion.div>

      <GroupDetailDrawer
        group={selected}
        onClose={() => setSelected(null)}
        onSettleUp={(gid) => {
          setSelected(null);
          onSettleUp(gid);
        }}
      />
      <CreateGroupDrawer open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

function GroupCard({ group, onOpen }: { group: Group; onOpen: () => void }) {
  const { data, memberById } = useStore();

  const { myBalance, spent } = useMemo(() => {
    const balances = computeBalances(data.expenses, data.settlements, group.id);
    const spent = data.expenses
      .filter((e) => e.groupId === group.id)
      .reduce((s, e) => s + e.amount, 0);
    return { myBalance: balances.get(ME) ?? 0, spent };
  }, [data.expenses, data.settlements, group.id]);

  const members = group.memberIds
    .map((id) => memberById.get(id))
    .filter((m): m is NonNullable<typeof m> => !!m);

  const settled = Math.abs(myBalance) < 0.01;

  return (
    <motion.button
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      onClick={onOpen}
      className="glass group flex h-full w-full flex-col rounded-3xl p-5 text-left transition-shadow hover:shadow-[0_0_40px_-8px_rgba(139,92,246,0.25)]"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-2xl ring-1 ring-inset ring-white/[0.08]">
          {group.emoji}
        </span>
        <ArrowRight
          size={16}
          className="mt-1 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-300"
        />
      </div>

      <p className="mt-4 text-sm font-semibold text-zinc-100">{group.name}</p>
      <p className="tabular mt-0.5 text-xs text-zinc-500">{formatMoney(spent)} total spent</p>

      <div className="mt-4 flex flex-1 items-end justify-between">
        <AvatarStack members={members} />
        <span
          className={`tabular rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
            settled
              ? "bg-white/[0.05] text-zinc-400 ring-white/10"
              : myBalance > 0
                ? "bg-emerald-400/10 text-emerald-300 ring-emerald-300/20"
                : "bg-rose-400/10 text-rose-300 ring-rose-300/20"
          }`}
        >
          {settled
            ? "settled"
            : myBalance > 0
              ? `+${formatMoney(myBalance)}`
              : `−${formatMoney(Math.abs(myBalance))}`}
        </span>
      </div>
    </motion.button>
  );
}

function GroupDetailDrawer({
  group,
  onClose,
  onSettleUp,
}: {
  group: Group | null;
  onClose: () => void;
  onSettleUp: (groupId: string) => void;
}) {
  const { data, memberById } = useStore();

  const detail = useMemo(() => {
    if (!group) return null;
    const balances = computeBalances(data.expenses, data.settlements, group.id);
    const debts = simplifyDebts(balances);
    const expenses = data.expenses
      .filter((e) => e.groupId === group.id)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
    return { balances, debts, expenses };
  }, [group, data.expenses, data.settlements]);

  return (
    <Drawer
      open={!!group}
      onClose={onClose}
      title={group ? `${group.emoji} ${group.name}` : ""}
      subtitle={group ? `${group.memberIds.length} members` : undefined}
      wide
    >
      {group && detail && (
        <div className="flex flex-col gap-6">
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                Simplified debts
              </h3>
              {detail.debts.length > 0 && (
                <button
                  onClick={() => onSettleUp(group.id)}
                  className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-300/20 transition-all hover:bg-emerald-400/20 active:scale-95"
                >
                  Settle up
                </button>
              )}
            </div>
            {detail.debts.length === 0 ? (
              <p className="glass-subtle rounded-2xl px-4 py-5 text-center text-sm text-zinc-500">
                Everyone is settled 🎉
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {detail.debts.map((d, i) => {
                  const from = memberById.get(d.from);
                  const to = memberById.get(d.to);
                  if (!from || !to) return null;
                  return (
                    <motion.li
                      key={`${d.from}-${d.to}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-subtle flex items-center gap-3 rounded-2xl px-4 py-3"
                    >
                      <Avatar member={from} size="sm" />
                      <span className="text-xs font-medium text-zinc-300">{from.name}</span>
                      <ArrowRight size={13} className="text-zinc-600" />
                      <Avatar member={to} size="sm" />
                      <span className="flex-1 text-xs font-medium text-zinc-300">{to.name}</span>
                      <span className="tabular text-sm font-bold text-zinc-100">
                        {formatMoney(d.amount)}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2.5 text-xs font-bold tracking-widest text-zinc-500 uppercase">
              Expenses
            </h3>
            {detail.expenses.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-600">No bills yet</p>
            ) : (
              <ul className="flex flex-col">
                <AnimatePresence mode="popLayout">
                  {detail.expenses.map((e) => (
                    <ExpenseRow key={e.id} expense={e} />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}

function CreateGroupDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, dispatch } = useStore();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set([ME]));
  const [newFriend, setNewFriend] = useState("");
  const [pendingFriends, setPendingFriends] = useState<string[]>([]);

  const friends = data.members.filter((m) => m.id !== ME);
  const canCreate = name.trim().length > 0 && memberIds.size + pendingFriends.length >= 2;

  const reset = () => {
    setName("");
    setEmoji("✨");
    setMemberIds(new Set([ME]));
    setNewFriend("");
    setPendingFriends([]);
  };

  const addFriend = () => {
    const trimmed = newFriend.trim();
    if (!trimmed) return;
    setPendingFriends((p) => [...p, trimmed]);
    setNewFriend("");
  };

  const create = () => {
    if (!canCreate) return;
    const newMembers = pendingFriends.map((friendName, i) => ({
      id: uid("m"),
      name: friendName,
      color: MEMBER_COLORS[(friends.length + i) % MEMBER_COLORS.length],
    }));
    dispatch({
      type: "ADD_GROUP",
      newMembers,
      group: {
        id: uid("grp"),
        name: name.trim(),
        emoji,
        memberIds: [...memberIds, ...newMembers.map((m) => m.id)],
        createdAt: new Date().toISOString(),
      },
    });
    reset();
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title="New group" subtitle="Split bills with friends">
      <div className="flex flex-col gap-5">
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Emoji</label>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
              className="glass-subtle h-11 w-14 rounded-xl text-center text-xl outline-none focus:ring-1 focus:ring-violet-400/50"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Group name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Trip to Manali…"
              autoFocus
              className="glass-subtle h-11 rounded-xl px-3.5 text-sm outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-violet-400/50"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-400">Members</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.members.map((m) => {
              const selected = memberIds.has(m.id);
              const isMe = m.id === ME;
              return (
                <button
                  key={m.id}
                  disabled={isMe}
                  onClick={() =>
                    setMemberIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(m.id)) next.delete(m.id);
                      else next.add(m.id);
                      return next;
                    })
                  }
                  className={`flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-xs font-medium ring-1 transition-all ring-inset ${
                    selected
                      ? "bg-violet-400/15 text-violet-200 ring-violet-300/30"
                      : "bg-white/[0.04] text-zinc-400 ring-white/[0.08] hover:bg-white/[0.08]"
                  } ${isMe ? "cursor-default" : "active:scale-95"}`}
                >
                  <Avatar member={m} size="sm" />
                  {m.name}
                </button>
              );
            })}
            {pendingFriends.map((friendName, i) => (
              <span
                key={`${friendName}-${i}`}
                className="flex items-center gap-2 rounded-full bg-emerald-400/10 py-1.5 pr-3.5 pl-3 text-xs font-medium text-emerald-200 ring-1 ring-inset ring-emerald-300/25"
              >
                <UsersRound size={12} />
                {friendName}
                <button
                  onClick={() => setPendingFriends((p) => p.filter((_, j) => j !== i))}
                  className="text-emerald-300/60 hover:text-emerald-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={newFriend}
              onChange={(e) => setNewFriend(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFriend()}
              placeholder="Add a new friend by name…"
              className="glass-subtle h-10 flex-1 rounded-xl px-3.5 text-sm outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-emerald-400/50"
            />
            <button
              onClick={addFriend}
              disabled={!newFriend.trim()}
              className="rounded-xl bg-white/[0.07] px-4 text-sm font-medium text-zinc-200 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/[0.12] disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>

        <button
          onClick={create}
          disabled={!canCreate}
          className="mt-2 h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-400 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.6)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          Create group
        </button>
      </div>
    </Drawer>
  );
}
