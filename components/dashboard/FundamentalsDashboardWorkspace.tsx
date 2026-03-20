"use client";

import { useMemo, useState } from "react";

import { stageOrder, FundingStage, OwnershipPoint } from "@/lib/sim/types";
import { stagePresets } from "@/data/presets";
import { calculateInvestorOwnership, calculatePostMoney, calculateRequiredExitValue } from "@/lib/engines/deterministic-finance";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HistogramChart } from "@/components/charts/HistogramChart";
import { OwnershipChart } from "@/components/charts/OwnershipChart";
import { ProbabilityChart } from "@/components/charts/ProbabilityChart";
import { formatCurrency, formatMultiple, formatPercent } from "@/lib/format";

function buildOwnershipSeries(): OwnershipPoint[] {
  return stageOrder.map((stage) => {
    const preset = stagePresets[stage];
    return {
      label: preset.label,
      founderPct: preset.founderBasePercent,
      employeePct: preset.employeeCommonPercent,
      investorPct: preset.investorOwnershipTarget,
      priorInvestorPct: Math.max(0, preset.priorInvestorPercent - preset.investorOwnershipTarget),
      poolPct: preset.employeePoolPercent,
    };
  });
}

const powerLawBuckets = [
  { label: "<1x", value: 0.65 },
  { label: "1x-3x", value: 0.21 },
  { label: "3x-10x", value: 0.1 },
  { label: "10x-25x", value: 0.03 },
  { label: "25x+", value: 0.01 },
];

const concentrationMetrics = [
  { label: "Deals below 1x", probability: 0.65 },
  { label: "Deals above 10x", probability: 0.04 },
  { label: "Top 6% drive returns", probability: 0.6 },
  { label: "One deal returns fund", probability: 0.011 },
];

export function FundamentalsDashboardWorkspace() {
  const [stage, setStage] = useState<FundingStage>("seed");
  const [checkSize, setCheckSize] = useState(3_000_000);
  const [targetOwnership, setTargetOwnership] = useState(0.2);
  const [fundSize, setFundSize] = useState(60_000_000);
  const [yearsToExit, setYearsToExit] = useState(6);
  const [learnMode, setLearnMode] = useState(true);

  const preset = stagePresets[stage];
  const postMoney = calculatePostMoney(preset.preMoney, checkSize);
  const ownership = calculateInvestorOwnership(preset.preMoney, checkSize);
  const threeXExit = calculateRequiredExitValue(checkSize * 3, ownership);
  const returnTheFundExit = calculateRequiredExitValue(fundSize, Math.max(ownership, targetOwnership));
  const impliedIrr = Math.pow(Math.max(0.01, 3), 1 / Math.max(1, yearsToExit)) - 1;
  const ownershipSeries = useMemo(() => buildOwnershipSeries(), []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Venture fundamentals dashboard</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold">Power law, dilution, and threshold math</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            This section teaches the mechanics behind venture outcomes before you open the full simulator or cap-table engine.
          </p>
        </div>
        <Button variant={learnMode ? "primary" : "secondary"} onClick={() => setLearnMode((current) => !current)}>
          {learnMode ? "Learn mode on" : "Learn mode off"}
        </Button>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr,1.35fr]">
        <Card>
          <h2 className="font-heading text-xl font-semibold">Live teaching controls</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <label className="space-y-2 text-sm">
              <span className="font-heading font-semibold text-foreground">Stage</span>
              <select
                value={stage}
                onChange={(event) => setStage(event.target.value as FundingStage)}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              >
                {stageOrder.map((entry) => (
                  <option key={entry} value={entry}>
                    {stagePresets[entry].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-heading font-semibold text-foreground">Investor check</span>
              <input
                type="number"
                value={checkSize}
                onChange={(event) => setCheckSize(Number(event.target.value))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-heading font-semibold text-foreground">Target ownership</span>
              <input
                type="number"
                step="0.01"
                value={targetOwnership}
                onChange={(event) => setTargetOwnership(Number(event.target.value))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-heading font-semibold text-foreground">Fund size</span>
              <input
                type="number"
                value={fundSize}
                onChange={(event) => setFundSize(Number(event.target.value))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-heading font-semibold text-foreground">Years to exit</span>
              <input
                type="number"
                min={1}
                max={15}
                value={yearsToExit}
                onChange={(event) => setYearsToExit(Number(event.target.value))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              />
            </label>
          </div>

          {learnMode ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-slate-700">
              <p className="font-semibold text-slate-900">What to notice</p>
              <p className="mt-2">
                Entry price matters twice. It sets ownership immediately, then compounds through every later dilution step.
                A smaller check at a higher entry price can still miss the power-law outcome you need to return the fund.
              </p>
            </div>
          ) : null}
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Benchmark pre-money</p>
            <p className="mt-3 font-heading text-3xl font-semibold">{formatCurrency(preset.preMoney)}</p>
            <p className="mt-2 text-sm text-slate-600">{preset.label} market median</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Post-money</p>
            <p className="mt-3 font-heading text-3xl font-semibold">{formatCurrency(postMoney)}</p>
            <p className="mt-2 text-sm text-slate-600">Pre-money plus check size</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Immediate ownership</p>
            <p className="mt-3 font-heading text-3xl font-semibold">{formatPercent(ownership)}</p>
            <p className="mt-2 text-sm text-slate-600">Priced-round ownership before later dilution</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">3x IRR example</p>
            <p className="mt-3 font-heading text-3xl font-semibold">{formatPercent(impliedIrr)}</p>
            <p className="mt-2 text-sm text-slate-600">Annualized IRR if 3x happens in {yearsToExit} years</p>
          </Card>
        </div>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <OwnershipChart data={ownershipSeries} />
        <Card>
          <h2 className="font-heading text-xl font-semibold">Threshold takeaways</h2>
          <dl className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
              <dt>3x exit requirement</dt>
              <dd className="font-semibold">{formatCurrency(threeXExit)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
              <dt>One company returns fund</dt>
              <dd className="font-semibold">{formatCurrency(returnTheFundExit)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
              <dt>Median next round size</dt>
              <dd className="font-semibold">{formatCurrency(preset.roundSize)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
              <dt>Founder base ownership</dt>
              <dd className="font-semibold">{formatPercent(preset.founderBasePercent)}</dd>
            </div>
          </dl>
          {learnMode ? (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              The ownership chart is intentionally stage-based. Venture math is path dependent, so the lesson is not just
              “who owns what now,” but how each financing step shifts who can actually participate in the eventual exit.
            </p>
          ) : null}
        </Card>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        <HistogramChart title="Illustrative Venture Return Buckets" data={powerLawBuckets} />
        <ProbabilityChart title="Power-Law Reality Checks" data={concentrationMetrics} />
      </div>
    </div>
  );
}
