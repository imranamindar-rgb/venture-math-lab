import type { PropsWithChildren } from "react";

import { InfoTip } from "@/components/ui/InfoTip";

interface FieldProps {
  label: string;
  hint: string;
}

export function Field({ label, hint, children }: PropsWithChildren<FieldProps>) {
  return (
    <label className="block space-y-2">
      <div className="flex items-start justify-between gap-4">
        <span className="flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
          <span>{label}</span>
          <InfoTip content={hint} label={`${label} help`} />
        </span>
      </div>
      {children}
      <p className="text-xs leading-5 text-slate-500">{hint}</p>
    </label>
  );
}
