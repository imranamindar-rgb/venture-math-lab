"use client";

import { useMemo, useState } from "react";

import { Card } from "@/components/ui/Card";
import { formatCurrency, formatMultiple, formatPercent } from "@/lib/format";
import { DeterministicRoundProjection } from "@/lib/engines/deterministic-finance";
import { OwnershipPoint } from "@/lib/sim/types";

export function CapTableEvolutionSlider({
  ownershipSeries,
  roundProjection,
}: {
  ownershipSeries: OwnershipPoint[];
  roundProjection: DeterministicRoundProjection[];
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedPoint = ownershipSeries[selectedIndex] ?? ownershipSeries[0];
  const selectedRound = selectedIndex === 0 ? null : roundProjection[selectedIndex - 1] ?? null;
  const marks = useMemo(
    () => ownershipSeries.map((point, index) => ({ index, label: point.label })),
    [ownershipSeries],
  );

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold">Cap-table evolution</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Step through the deterministic round path and watch ownership move before the final waterfall runs.
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{selectedPoint.label}</p>
      </div>

      <div className="mt-5">
        <label className="block text-xs uppercase tracking-[0.16em] text-slate-500" htmlFor="cap-table-evolution-slider">
          Round step
        </label>
        <input
          id="cap-table-evolution-slider"
          type="range"
          min={0}
          max={Math.max(0, ownershipSeries.length - 1)}
          step={1}
          value={selectedIndex}
          onChange={(event) => setSelectedIndex(Number(event.target.value))}
          className="mt-3 w-full accent-amber-700"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {marks.map((mark) => (
            <button
              key={mark.label}
              type="button"
              onClick={() => setSelectedIndex(mark.index)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
                selectedIndex === mark.index
                  ? "bg-primary text-white"
                  : "border border-border bg-white text-slate-600 hover:border-primary/40 hover:text-slate-950"
              }`}
            >
              {mark.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Founder</p>
          <p className="mt-2 font-heading text-2xl font-semibold">{formatPercent(selectedPoint.founderPct)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Employee common</p>
          <p className="mt-2 font-heading text-2xl font-semibold">{formatPercent(selectedPoint.employeePct)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Modeled investor</p>
          <p className="mt-2 font-heading text-2xl font-semibold">{formatPercent(selectedPoint.investorPct)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Prior investors</p>
          <p className="mt-2 font-heading text-2xl font-semibold">{formatPercent(selectedPoint.priorInvestorPct)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Option pool</p>
          <p className="mt-2 font-heading text-2xl font-semibold">{formatPercent(selectedPoint.poolPct)}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
        {selectedRound ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pre-money</p>
              <p className="mt-2 font-semibold text-slate-900">{formatCurrency(selectedRound.preMoney)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Round size</p>
              <p className="mt-2 font-semibold text-slate-900">{formatCurrency(selectedRound.roundSize)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Step-up</p>
              <p className="mt-2 font-semibold text-slate-900">{formatMultiple(selectedRound.stepUpRatio)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Months elapsed</p>
              <p className="mt-2 font-semibold text-slate-900">{selectedRound.monthsElapsed}</p>
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              {selectedRound.antiDilutionApplied
                ? "Anti-dilution protection fired in this round, so the preferred stack absorbed some of the dilution before common holders did."
                : "No anti-dilution adjustment fired in this round. Ownership moved through standard issuance and any pool refresh."}
            </div>
          </div>
        ) : (
          <p>
            This is the current cap table before the next priced round compounds dilution. Move the slider to see how later rounds change the stack.
          </p>
        )}
      </div>
    </Card>
  );
}
