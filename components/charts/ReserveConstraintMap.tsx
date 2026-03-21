"use client";

import { formatCompactNumber, formatMultiple, formatPercent } from "@/lib/format";

function getCellTone(feasible: boolean, netTVPI: number) {
  if (!feasible) {
    return "bg-slate-100 text-slate-500";
  }
  if (netTVPI >= 2.5) {
    return "bg-emerald-100 text-emerald-950";
  }
  if (netTVPI >= 1.75) {
    return "bg-teal-100 text-teal-950";
  }
  if (netTVPI >= 1) {
    return "bg-amber-100 text-amber-950";
  }
  return "bg-rose-100 text-rose-950";
}

export function ReserveConstraintMap({
  fundSizes,
  reserveRatios,
  cells,
  recommendedCell,
  note,
}: {
  fundSizes: number[];
  reserveRatios: number[];
  cells: Array<{
    fundSize: number;
    reserveRatio: number;
    netTVPIMedian: number;
    modeledCompanyCount: number;
    topQuartileProbability: number;
    feasible: boolean;
  }>;
  recommendedCell: {
    fundSize: number;
    reserveRatio: number;
    netTVPIMedian: number;
    modeledCompanyCount: number;
    topQuartileProbability: number;
    feasible: boolean;
  } | null;
  note: string;
}) {
  const cellMap = new Map(cells.map((cell) => [`${cell.fundSize}-${cell.reserveRatio}`, cell]));

  return (
    <div
      className="overflow-hidden rounded-panel border border-border/70 bg-white p-4"
      role="img"
      aria-label="Reserve-ratio optimizer showing fund size versus reserve ratio with net TVPI and diversification constraints."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold">Reserve-ratio optimizer</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{note}</p>
        </div>
        {recommendedCell ? (
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Recommended {formatCompactNumber(recommendedCell.fundSize)} / {formatPercent(recommendedCell.reserveRatio)}
          </p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-2 text-sm text-slate-700">
          <caption className="sr-only">
            Constraint map across fund sizes and reserve ratios. Each cell shows median net TVPI and modeled company count.
          </caption>
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
              <th className="px-2 py-2">Fund size</th>
              {reserveRatios.map((reserveRatio) => (
                <th key={reserveRatio} className="min-w-[112px] px-2 py-2">
                  {formatPercent(reserveRatio)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fundSizes.map((fundSize) => (
              <tr key={fundSize}>
                <th className="px-2 py-2 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  {formatCompactNumber(fundSize)}
                </th>
                {reserveRatios.map((reserveRatio) => {
                  const cell = cellMap.get(`${fundSize}-${reserveRatio}`);
                  if (!cell) {
                    return <td key={reserveRatio} className="rounded-2xl bg-slate-50 px-3 py-3" />;
                  }

                  return (
                    <td key={reserveRatio} className={`rounded-2xl px-3 py-3 align-top ${getCellTone(cell.feasible, cell.netTVPIMedian)}`}>
                      <div className="font-semibold">{formatMultiple(cell.netTVPIMedian)}</div>
                      <div className="mt-1 text-xs">{cell.modeledCompanyCount} companies</div>
                      <div className="mt-2 text-[11px] leading-5 opacity-80">
                        Top quartile {formatPercent(cell.topQuartileProbability)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {recommendedCell ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-slate-700">
          Best feasible cell currently favors {formatCompactNumber(recommendedCell.fundSize)} with a{" "}
          {formatPercent(recommendedCell.reserveRatio)} reserve ratio, supporting {recommendedCell.modeledCompanyCount} companies
          at {formatMultiple(recommendedCell.netTVPIMedian)} median net TVPI.
        </div>
      ) : null}
    </div>
  );
}
