"use client";

import { useEffect, useRef, startTransition } from "react";

import { presetOptions, useScenarioStore } from "@/lib/state/scenario-store";
import { useSimulationRunner } from "@/components/simulator/useSimulationRunner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatPercent, formatMultiple } from "@/lib/format";

function ComparisonColumn({
  title,
  description,
  value,
  detail,
}: {
  title: string;
  description: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="h-full">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <p className="mt-3 font-heading text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">{detail}</p>
    </Card>
  );
}

export function CompareWorkspace() {
  const { active, comparison, setActivePreset, setComparisonPreset } = useScenarioStore();
  const { run: runActive, summary: baseline } = useSimulationRunner();
  const { run: runComparison, summary: stress } = useSimulationRunner();
  const lastAutoRunKey = useRef<string | null>(null);

  useEffect(() => {
    const runKey = `${active.id}:${comparison.id}`;
    if (lastAutoRunKey.current === runKey) {
      return;
    }

    lastAutoRunKey.current = runKey;
    runActive(active);
    runComparison(comparison);
  }, [active, comparison, runActive, runComparison]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Scenario compare</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold">Baseline vs stress case</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Compare the same venture story under different market regimes, instruments, and dilution assumptions.
          </p>
        </div>
        <Button
          onClick={() =>
            startTransition(() => {
              runActive(active);
              runComparison(comparison);
            })
          }
        >
          Refresh both runs
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Baseline</p>
          <select
            value={active.id}
            onChange={(event) => setActivePreset(event.target.value)}
            className="mt-4 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
          >
            {presetOptions.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <p className="mt-3 text-sm text-slate-600">{active.description}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Comparison</p>
          <select
            value={comparison.id}
            onChange={(event) => setComparisonPreset(event.target.value)}
            className="mt-4 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
          >
            {presetOptions.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <p className="mt-3 text-sm text-slate-600">{comparison.description}</p>
        </Card>
      </div>

      {baseline && stress ? (
        <div className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <ComparisonColumn
              title="Founder median"
              value={`${formatCurrency(baseline.founder.median)} vs ${formatCurrency(stress.founder.median)}`}
              description="Founder proceeds are usually the first place fragile step-up math shows up."
              detail={`Delta ${formatCurrency(baseline.founder.median - stress.founder.median)}`}
            />
            <ComparisonColumn
              title="Employee underwater risk"
              value={`${formatPercent(baseline.employee.underwaterProbability)} vs ${formatPercent(
                stress.employee.underwaterProbability,
              )}`}
              description="This shows how quickly employees lose practical equity value when strike price and dilution drift apart."
              detail={`Delta ${formatPercent(
                stress.employee.underwaterProbability - baseline.employee.underwaterProbability,
              )}`}
            />
            <ComparisonColumn
              title="Investor power-law spread"
              value={`${formatMultiple(baseline.meanVsMedianSpread)} vs ${formatMultiple(
                stress.meanVsMedianSpread,
              )}`}
              description="A wide spread means the economics rely on rare outliers rather than typical venture outcomes."
              detail={`Return-the-fund ${formatPercent(baseline.investor.returnTheFundProbability)} vs ${formatPercent(
                stress.investor.returnTheFundProbability,
              )}`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="font-heading text-xl font-semibold">Baseline pressure points</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {baseline.riskLayers.map((metric) => (
                  <li key={metric.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                    <span>{metric.label}</span>
                    <span className="font-semibold">{formatPercent(metric.probability)}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="font-heading text-xl font-semibold">Stress-case pressure points</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {stress.riskLayers.map((metric) => (
                  <li key={metric.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                    <span>{metric.label}</span>
                    <span className="font-semibold">{formatPercent(metric.probability)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
