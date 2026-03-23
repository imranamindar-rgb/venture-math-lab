"use client";

import { ChangeEvent, useEffect, useState } from "react";

import { formatMoneyScaleHint, formatNumberInput } from "@/lib/format";

interface MoneyInputProps {
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
  showScaleHint?: boolean;
  min?: number;
}

function sanitizeMoneyInput(raw: string) {
  const negative = raw.trim().startsWith("-");
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  const decimal = rest.join("");
  const hasDecimal = raw.includes(".");

  return {
    normalized: `${negative ? "-" : ""}${whole}${hasDecimal ? `.${decimal}` : ""}`,
    hasDecimal,
  };
}

function formatGroupedInput(raw: string, hasDecimal: boolean) {
  if (raw === "" || raw === "-" || raw === "." || raw === "-.") {
    return raw;
  }

  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const [whole = "", decimal = ""] = unsigned.split(".");
  const safeWhole = whole === "" ? "0" : whole;
  const groupedWhole = Number(safeWhole).toLocaleString("en-US");

  return `${negative ? "-" : ""}${groupedWhole}${hasDecimal ? `.${decimal}` : ""}`;
}

export function MoneyInput({
  value,
  onValueChange,
  className = "w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm",
  showScaleHint = true,
  min = 0,
}: MoneyInputProps) {
  const [displayValue, setDisplayValue] = useState(formatNumberInput(value));
  const hasError = Number.isFinite(min) && value < min;

  useEffect(() => {
    setDisplayValue(formatNumberInput(value));
  }, [value]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { normalized, hasDecimal } = sanitizeMoneyInput(event.target.value);
    setDisplayValue(formatGroupedInput(normalized, hasDecimal));

    if (normalized === "" || normalized === "-" || normalized === "." || normalized === "-.") {
      onValueChange(0);
      return;
    }

    const nextValue = Number(normalized);
    if (Number.isFinite(nextValue)) {
      onValueChange(nextValue);
    }
  }

  const borderClass = hasError
    ? className.replace("border-border", "border-red-400")
    : className;

  return (
    <div className="space-y-2">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
        <input type="text" inputMode="decimal" value={displayValue} onChange={handleChange} className={`${borderClass} pl-8`} />
      </div>
      {hasError ? (
        <p className="text-xs leading-5 font-medium text-red-600" role="alert">Value must be at least {formatMoneyScaleHint(min)}</p>
      ) : showScaleHint ? (
        <p className="text-xs leading-5 text-slate-500">Reads as {formatMoneyScaleHint(value)}</p>
      ) : null}
    </div>
  );
}
