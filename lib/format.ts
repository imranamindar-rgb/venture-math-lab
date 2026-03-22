export function safeFixed(value: number, digits: number) {
  if (!Number.isFinite(value)) {
    return value !== value ? "—" : "∞";
  }
  return value.toFixed(digits);
}

function tryCompactNumberFormat(
  value: number,
  options: Intl.NumberFormatOptions,
) {
  try {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      ...options,
    }).format(value);
  } catch {
    return null;
  }
}

function fallbackCompactCurrency(value: number) {
  const absolute = Math.abs(value);

  if (absolute >= 1_000_000_000) {
    const billions = value / 1_000_000_000;
    const fractionDigits = Math.abs(billions) >= 10 ? 0 : 1;
    return `$${billions.toLocaleString("en-US", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}B`;
  }

  if (absolute >= 1_000_000) {
    const millions = value / 1_000_000;
    const fractionDigits = Math.abs(millions) >= 10 ? 0 : 1;
    return `$${millions.toLocaleString("en-US", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}M`;
  }

  if (absolute >= 1_000) {
    const thousands = value / 1_000;
    const fractionDigits = Math.abs(thousands) >= 10 ? 0 : 1;
    return `$${thousands.toLocaleString("en-US", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}K`;
  }

  return formatCurrency(value);
}

export function formatCompactCurrency(value: number) {
  return (
    tryCompactNumberFormat(value, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 1,
    }) ?? fallbackCompactCurrency(value)
  );
}

export function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return value !== value ? "$—" : value > 0 ? "$∞" : "-$∞";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function formatNumberInput(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

export function formatMoneyScaleHint(value: number) {
  const absolute = Math.abs(value);

  if (absolute >= 1_000_000_000) {
    return formatCompactCurrency(value);
  }

  if (absolute >= 1_000_000) {
    const billions = value / 1_000_000;
    const fractionDigits = Math.abs(billions) >= 10 ? 0 : 1;
    return `$${billions.toLocaleString("en-US", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}M`;
  }

  if (absolute >= 1_000) {
    return formatCompactCurrency(value);
  }

  return formatCurrency(value);
}

export function formatPercent(value: number, maximumFractionDigits = 1) {
  if (!Number.isFinite(value)) {
    return value !== value ? "—%" : value > 0 ? "∞%" : "-∞%";
  }
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits,
  }).format(value);
}

export function formatMultiple(value: number) {
  if (!Number.isFinite(value)) {
    return value !== value ? "—x" : value > 0 ? "∞x" : "-∞x";
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)}x`;
}

export function formatCompactNumber(value: number) {
  if (!Number.isFinite(value)) {
    return value !== value ? "—" : value > 0 ? "∞" : "-∞";
  }
  return (
    tryCompactNumberFormat(value, {
      maximumFractionDigits: 1,
    }) ??
    value.toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })
  );
}
