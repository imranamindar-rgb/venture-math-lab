"use client";

import { ChangeEvent, useEffect, useState } from "react";

import { formatMillionsValue, formatNumberInput } from "@/lib/format";

interface MoneyInputProps {
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
  showMillionsHint?: boolean;
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
  showMillionsHint = true,
}: MoneyInputProps) {
  const [displayValue, setDisplayValue] = useState(formatNumberInput(value));

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

  return (
    <div className="space-y-2">
      <input type="text" inputMode="decimal" value={displayValue} onChange={handleChange} className={className} />
      {showMillionsHint ? (
        <p className="text-xs leading-5 text-slate-500">Reads as {formatMillionsValue(value)}</p>
      ) : null}
    </div>
  );
}
