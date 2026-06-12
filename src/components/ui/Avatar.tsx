import { cn, initials } from "../../lib/utils";
import type { Member } from "../../lib/types";

export function Avatar({
  member,
  size = "md",
  className,
}: {
  member: Member;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-6 w-6 text-[9px]",
    md: "h-8 w-8 text-[11px]",
    lg: "h-11 w-11 text-sm",
  };
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-white/15",
        sizes[size],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${member.color}33, ${member.color}18)`,
        color: member.color,
      }}
      title={member.name}
    >
      {initials(member.name)}
    </div>
  );
}

export function AvatarStack({ members, max = 4 }: { members: Member[]; max?: number }) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((m) => (
        <Avatar key={m.id} member={m} size="sm" className="ring-2 ring-base-900" />
      ))}
      {extra > 0 && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[9px] font-semibold text-zinc-300 ring-2 ring-base-900">
          +{extra}
        </div>
      )}
    </div>
  );
}
