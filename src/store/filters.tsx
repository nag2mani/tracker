/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Category, Expense } from "../lib/types";

export type TypeFilter = "all" | "personal" | "group";

interface FilterState {
  categories: Set<Category>;
  type: TypeFilter;
  toggleCategory: (c: Category) => void;
  setType: (t: TypeFilter) => void;
  clear: () => void;
  isActive: boolean;
  matches: (e: Expense) => boolean;
}

const FilterContext = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Set<Category>>(new Set());
  const [type, setType] = useState<TypeFilter>("all");

  const value = useMemo<FilterState>(() => {
    const matches = (e: Expense) => {
      if (type !== "all" && e.type !== type) return false;
      if (categories.size > 0 && !categories.has(e.category)) return false;
      return true;
    };
    return {
      categories,
      type,
      setType,
      toggleCategory: (c) =>
        setCategories((prev) => {
          const next = new Set(prev);
          if (next.has(c)) next.delete(c);
          else next.add(c);
          return next;
        }),
      clear: () => {
        setCategories(new Set());
        setType("all");
      },
      isActive: categories.size > 0 || type !== "all",
      matches,
    };
  }, [categories, type]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterState {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside <FilterProvider>");
  return ctx;
}
