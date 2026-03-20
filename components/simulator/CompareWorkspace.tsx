"use client";

import { useEffect, useRef, startTransition } from "react";

import { presetOptions, useScenarioStore } from "@/lib/state/scenario-store";
import { useSimulationRunner } from "@/components/simulator/useSimulationRunner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SupportBadge } from "@/components/ui/SupportBadge";
import { analyzeScenario } from "@/lib/scenario-diagnostics";
import { getCurrentFinancing } from "@/lib/current-financing";
import { buildComparisonCsv, buildComparisonMarkdown } from "@/lib/export";
import { formatCurrency } from "@/lib/format";
import { buildComparisonPayload } from "@/lib/reporting";

function downloadText(filename: string, payload: string, type: string) {
  const blob = new Blob([payload], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

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
  const baselineDiagnostics = analyzeScenario(active);
  const comparisonDiagnostics = analyzeScenario(comparison);
  const baselineFinancing = getCurrentFinancing(active);
  const comparisonFinancing = getCurrentFinancing(comparison);
  const comparePayload =
    baseline && stress ? buildComparisonPayload(active, comparison, baseline, stress) : null;

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
        <Button
          variant="secondary"
          onClick={() =>
            baseline && stress
              ? downloadText(
                  `${active.id}-vs-${comparison.id}.csv`,
                  buildComparisonCsv(active, comparison, baseline, stress),
                  "text/csv;charset=utf-8",
                )
              : undefined
          }
        >
          Export Compare CSV
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            baseline && stress
              ? downloadText(
                  `${active.id}-vs-${comparison.id}.md`,
                  buildComparisonMarkdown(active, comparison, baseline, stress),
                  "text/markdown;charset=utf-8",
                )
              : undefined
          }
        >
          Export Compare Memo
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Baseline</p>
            <SupportBadge level={baselineDiagnostics.supportLevel} />
          </div>
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
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Comparison</p>
            <SupportBadge level={comparisonDiagnostics.supportLevel} />
          </div>
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {comparePayload?.headlineCards.map((card) => (
              <ComparisonColumn
                key={card.label}
                title={card.label}
                value={`${card.baseline} vs ${card.comparison}`}
                description={card.interpretation}
                detail={`Delta ${card.delta}`}
              />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="font-heading text-xl font-semibold">Assumption shifts</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <span>Round type</span>
                  <span className="font-semibold">
                    {active.currentRoundKind.replaceAll("_", " ")} vs {comparison.currentRoundKind.replaceAll("_", " ")}
                  </span>
                </li>
                <li className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <span>Current raise</span>
                  <span className="font-semibold">
                    {formatCurrency(baselineFinancing.totalRoundRaise)} vs {formatCurrency(comparisonFinancing.totalRoundRaise)}
                  </span>
                </li>
                <li className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <span>Investor at risk</span>
                  <span className="font-semibold">
                    {formatCurrency(baselineFinancing.modeledInvestorCheck)} vs {formatCurrency(comparisonFinancing.modeledInvestorCheck)}
                  </span>
                </li>
                <li className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <span>Market / sector</span>
                  <span className="font-semibold">
                    {active.marketOverlay}/{active.sectorOverlay} vs {comparison.marketOverlay}/{comparison.sectorOverlay}
                  </span>
                </li>
              </ul>
            </Card>
            <Card>
              <h2 className="font-heading text-xl font-semibold">Driver deltas</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {comparePayload?.driverCards.map((card) => (
                  <li key={card.label} className="rounded-2xl bg-slate-50 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-900">{card.label}</span>
                      <span className="font-semibold text-slate-900">{card.delta}</span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                      {card.baseline} vs {card.comparison}
                    </p>
                    <p className="mt-2 leading-6 text-slate-600">{card.interpretation}</p>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="font-heading text-xl font-semibold">Risk-layer movement</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {comparePayload?.riskLayerCards.map((card) => (
                  <li key={card.label} className="rounded-2xl bg-slate-50 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-900">{card.label}</span>
                      <span className="font-semibold text-slate-900">{card.delta}</span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                      {card.baseline} vs {card.comparison}
                    </p>
                    <p className="mt-2 leading-6 text-slate-600">{card.interpretation}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card>
            <h2 className="font-heading text-xl font-semibold">Board notes</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {comparePayload?.boardNotes.map((note) => (
                <li key={note} className="rounded-2xl bg-slate-50 px-4 py-3">
                  {note}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
