import type { AppData, Expense } from "./types";
import { ME } from "./types";
import { resolveSplits } from "./splitwise";
import { daysAgoISO, uid } from "./utils";

function groupExpense(
  args: Omit<Expense, "id" | "type" | "splits" | "splitMethod"> & {
    groupId: string;
    paidBy: string;
    participants: string[];
    method?: Expense["splitMethod"];
    values?: Record<string, number>;
  },
): Expense {
  const { participants, method = "equal", values, ...rest } = args;
  return {
    ...rest,
    id: uid("exp"),
    type: "group",
    splitMethod: method,
    splits: resolveSplits(method, args.amount, participants, values),
  };
}

function personal(
  args: Omit<Expense, "id" | "type" | "splits" | "splitMethod" | "paidBy" | "groupId">,
): Expense {
  return { ...args, id: uid("exp"), type: "personal" };
}

export function buildSeedData(): AppData {
  const members = [
    { id: ME, name: "You", color: "#34d399" },
    { id: "m_aarav", name: "Aarav", color: "#8b5cf6" },
    { id: "m_priya", name: "Priya", color: "#f472b6" },
    { id: "m_rohan", name: "Rohan", color: "#38bdf8" },
    { id: "m_sneha", name: "Sneha", color: "#fbbf24" },
    { id: "m_kabir", name: "Kabir", color: "#fb7185" },
  ];

  const flat = {
    id: "grp_flat",
    name: "Flat 4B · HSR Layout",
    emoji: "🏠",
    memberIds: [ME, "m_aarav", "m_priya"],
    createdAt: daysAgoISO(120),
  };
  const goa = {
    id: "grp_goa",
    name: "Goa Trip ’26",
    emoji: "🌴",
    memberIds: [ME, "m_rohan", "m_sneha", "m_kabir"],
    createdAt: daysAgoISO(34),
  };
  const office = {
    id: "grp_office",
    name: "Office Lunch Club",
    emoji: "🍱",
    memberIds: [ME, "m_priya", "m_rohan"],
    createdAt: daysAgoISO(60),
  };

  const expenses: Expense[] = [
    // ---- personal, current month ----
    personal({ description: "BigBasket weekly haul", amount: 2480, category: "Grocery", date: daysAgoISO(2) }),
    personal({ description: "Spotify + Netflix", amount: 798, category: "Entertainment", date: daysAgoISO(4) }),
    personal({ description: "Third Wave Coffee", amount: 540, category: "Dining", date: daysAgoISO(5) }),
    personal({ description: "Electricity bill (BESCOM)", amount: 1320, category: "Utilities", date: daysAgoISO(7) }),
    personal({ description: "Blinkit midnight run", amount: 642, category: "Grocery", date: daysAgoISO(9) }),
    personal({ description: "PVR — Dune Part Three", amount: 950, category: "Entertainment", date: daysAgoISO(11) }),
    personal({ description: "Gym membership", amount: 1800, category: "Others", date: daysAgoISO(13) }),
    personal({ description: "Airtel fiber", amount: 1099, category: "Utilities", date: daysAgoISO(15) }),
    // ---- personal, previous months (trend data) ----
    personal({ description: "Decathlon running shoes", amount: 3499, category: "Others", date: daysAgoISO(38) }),
    personal({ description: "Monthly groceries", amount: 5240, category: "Grocery", date: daysAgoISO(44) }),
    personal({ description: "Concert — Indie night", amount: 1500, category: "Entertainment", date: daysAgoISO(52) }),
    personal({ description: "Monthly groceries", amount: 4890, category: "Grocery", date: daysAgoISO(74) }),
    personal({ description: "Electricity bill", amount: 1185, category: "Utilities", date: daysAgoISO(68) }),
    personal({ description: "Weekend brunch", amount: 1240, category: "Dining", date: daysAgoISO(81) }),

    // ---- Flat 4B ----
    groupExpense({
      description: "June rent", amount: 45000, category: "Rent", date: daysAgoISO(8),
      groupId: flat.id, paidBy: ME, participants: flat.memberIds,
      method: "percentage", values: { [ME]: 40, m_aarav: 35, m_priya: 25 },
    }),
    groupExpense({
      description: "WiFi + maintenance", amount: 3600, category: "Utilities", date: daysAgoISO(6),
      groupId: flat.id, paidBy: "m_aarav", participants: flat.memberIds,
    }),
    groupExpense({
      description: "House groceries (DMart)", amount: 4170, category: "Grocery", date: daysAgoISO(3),
      groupId: flat.id, paidBy: "m_priya", participants: flat.memberIds,
    }),
    groupExpense({
      description: "May rent", amount: 45000, category: "Rent", date: daysAgoISO(38),
      groupId: flat.id, paidBy: ME, participants: flat.memberIds,
      method: "percentage", values: { [ME]: 40, m_aarav: 35, m_priya: 25 },
    }),

    // ---- Goa Trip ----
    groupExpense({
      description: "Beach villa — 3 nights", amount: 24800, category: "Others", date: daysAgoISO(26),
      groupId: goa.id, paidBy: "m_rohan", participants: goa.memberIds,
    }),
    groupExpense({
      description: "Seafood shack dinner", amount: 5640, category: "Dining", date: daysAgoISO(25),
      groupId: goa.id, paidBy: ME, participants: goa.memberIds,
    }),
    groupExpense({
      description: "Scooter rentals", amount: 3200, category: "Others", date: daysAgoISO(25),
      groupId: goa.id, paidBy: "m_sneha", participants: goa.memberIds,
      method: "exact", values: { [ME]: 800, m_rohan: 800, m_sneha: 800, m_kabir: 800 },
    }),
    groupExpense({
      description: "Club night — Tito’s", amount: 7200, category: "Entertainment", date: daysAgoISO(24),
      groupId: goa.id, paidBy: "m_kabir", participants: goa.memberIds,
    }),

    // ---- Office Lunch Club ----
    groupExpense({
      description: "Friday biryani order", amount: 1740, category: "Dining", date: daysAgoISO(1),
      groupId: office.id, paidBy: ME, participants: office.memberIds,
    }),
    groupExpense({
      description: "Team café outing", amount: 2310, category: "Dining", date: daysAgoISO(12),
      groupId: office.id, paidBy: "m_priya", participants: office.memberIds,
    }),
  ];

  const settlements = [
    {
      id: uid("set"),
      from: "m_kabir",
      to: "m_rohan",
      amount: 3000,
      date: daysAgoISO(20),
      groupId: goa.id,
    },
  ];

  return { members, groups: [flat, goa, office], expenses, settlements };
}
