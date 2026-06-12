/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { AppData, Expense, Group, Member, Settlement } from "../lib/types";
import { buildSeedData } from "../lib/seed";

const STORAGE_KEY = "lumina:data:v1";

type Action =
  | { type: "ADD_EXPENSE"; expense: Expense }
  | { type: "DELETE_EXPENSE"; id: string }
  | { type: "ADD_GROUP"; group: Group; newMembers: Member[] }
  | { type: "ADD_SETTLEMENT"; settlement: Settlement }
  | { type: "RESET" };

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case "ADD_EXPENSE":
      return { ...state, expenses: [action.expense, ...state.expenses] };
    case "DELETE_EXPENSE":
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.id),
      };
    case "ADD_GROUP":
      return {
        ...state,
        members: [...state.members, ...action.newMembers],
        groups: [...state.groups, action.group],
      };
    case "ADD_SETTLEMENT":
      return { ...state, settlements: [action.settlement, ...state.settlements] };
    case "RESET":
      return buildSeedData();
    default:
      return state;
  }
}

function loadInitial(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed.members && parsed.expenses && parsed.groups) return parsed;
    }
  } catch {
    // corrupted storage — fall through to seed
  }
  return buildSeedData();
}

interface StoreContextValue {
  data: AppData;
  dispatch: React.Dispatch<Action>;
  memberById: Map<string, Member>;
  groupById: Map<string, Group>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage full / unavailable — app still works in-memory
    }
  }, [data]);

  const value = useMemo<StoreContextValue>(
    () => ({
      data,
      dispatch,
      memberById: new Map(data.members.map((m) => [m.id, m])),
      groupById: new Map(data.groups.map((g) => [g.id, g])),
    }),
    [data],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
