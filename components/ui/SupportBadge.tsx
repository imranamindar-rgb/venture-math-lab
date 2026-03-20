import clsx from "clsx";

import { SupportLevel } from "@/lib/scenario-diagnostics";

export function SupportBadge({ level, label }: { level: SupportLevel; label?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        level === "standard" && "border-emerald-200 bg-emerald-50 text-emerald-900",
        level === "approximate" && "border-amber-200 bg-amber-50 text-amber-900",
        level === "unsupported" && "border-rose-200 bg-rose-50 text-rose-900",
      )}
    >
      {label ??
        (level === "standard" ? "Standard" : level === "approximate" ? "Approximate" : "Unsupported")}
    </span>
  );
}
