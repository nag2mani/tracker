/* eslint-disable react-refresh/only-export-components */
import {
  Clapperboard,
  Home,
  Package,
  ShoppingBasket,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "../../lib/types";
import { CATEGORY_META } from "../../lib/types";

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Grocery: ShoppingBasket,
  Rent: Home,
  Entertainment: Clapperboard,
  Dining: UtensilsCrossed,
  Utilities: Zap,
  Others: Package,
};

export function CategoryIcon({ category, size = 15 }: { category: Category; size?: number }) {
  const Icon = CATEGORY_ICONS[category];
  const meta = CATEGORY_META[category];
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/[0.08]"
      style={{ background: meta.soft, color: meta.color }}
    >
      <Icon size={size} strokeWidth={2.2} />
    </span>
  );
}
