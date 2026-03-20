import type { PropsWithChildren } from "react";

interface FieldProps {
  label: string;
  hint: string;
}

export function Field({ label, hint, children }: PropsWithChildren<FieldProps>) {
  return (
    <label className="block space-y-2">
      <div className="flex items-start justify-between gap-4">
        <span className="font-heading text-sm font-semibold text-foreground">{label}</span>
      </div>
      {children}
      <p className="text-xs leading-5 text-slate-500">{hint}</p>
    </label>
  );
}
