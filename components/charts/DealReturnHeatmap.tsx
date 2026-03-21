"use client";

import { formatCompactNumber, formatCurrency, formatMultiple, formatPercent } from "@/lib/format";

function getCellTone(irr: number) {
  if (irr >= 0.3) {
    return "bg-emerald-100 text-emerald-950";
  }
  if (irr >= 0.15) {
    return "bg-teal-100 text-teal-950";
  }
  if (irr >= 0.05) {
    return "bg-amber-100 text-amber-950";
  }
  if (irr >= 0) {
    return "bg-orange-100 text-orange-950";
  }
  return "bg-rose-100 text-rose-950";
}

export function DealReturnHeatmap({
  anchorExitValue,
  exitValues,
  years,
  cells,
}: {
  anchorExitValue: number;
  exitValues: number[];
  years: number[];
  cells: Array<{
    yearsToExit: number;
    exitValue: number;
    investorMoic: number;
    investorIrr: number;
    founderNet: number;
  }>;
}) {
  const cellMap = new Map(cells.map((cell) => [`${cell.yearsToExit}-${cell.exitValue}`, cell]));

  return (
    <div
      className="overflow-hidden rounded-panel border border-border/70 bg-white p-4"
      role="img"
      aria-label="Deal return heatmap showing investor MOIC and IRR by exit value and years to exit."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold">Deal return heatmap</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Each cell shows investor MOIC and IRR for the current round economics before later financing changes the cap table.
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
          Exit anchor {formatCurrency(anchorExitValue)}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-2 text-sm text-slate-700">
          <caption className="sr-only">
            Investor return heatmap by years to exit and exit value. Each cell contains MOIC and IRR.
          </caption>
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
              <th className="px-2 py-2">Years</th>
              {exitValues.map((exitValue) => (
                <th key={exitValue} className="min-w-[110px] px-2 py-2">
                  <div>{formatMultiple(exitValue / anchorExitValue)}</div>
                  <div className="mt-1 text-[10px] normal-case tracking-normal text-slate-400">
                    {formatCompactNumber(exitValue)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year}>
                <th className="px-2 py-2 text-left text-xs uppercase tracking-[0.16em] text-slate-500">{year}y</th>
                {exitValues.map((exitValue) => {
                  const cell = cellMap.get(`${year}-${exitValue}`);
                  if (!cell) {
                    return <td key={exitValue} className="rounded-2xl bg-slate-50 px-3 py-3" />;
                  }

                  return (
                    <td key={exitValue} className={`rounded-2xl px-3 py-3 align-top ${getCellTone(cell.investorIrr)}`}>
                      <div className="font-semibold">{formatMultiple(cell.investorMoic)}</div>
                      <div className="mt-1 text-xs">{formatPercent(cell.investorIrr)}</div>
                      <div className="mt-2 text-[11px] leading-5 opacity-80">
                        Founder {formatCurrency(cell.founderNet)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        Cells move from loss-making to attractive as both exit magnitude and timing improve. This is the cleanest IC-style
        view of how entry price and time interact before path uncertainty is layered on.
      </p>
    </div>
  );
}
