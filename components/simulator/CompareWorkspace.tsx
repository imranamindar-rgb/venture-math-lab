"use client";

import { useEffect, startTransition } from "react";

import { presetOptions, useScenarioStore } from "@/lib/state/scenario-store";
import { useSimulationRunner } from "@/components/simulator/useSimulationRunner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SupportBadge } from "@/components/ui/SupportBadge";
import { TermSheetComparatorChart } from "@/components/charts/TermSheetComparatorChart";
import { analyzeScenario } from "@/lib/scenario-diagnostics";
import { getCurrentFinancing } from "@/lib/current-financing";
import { buildComparisonCsv, buildComparisonMarkdown } from "@/lib/export";
import { formatCurrency, formatPercent, safeFixed } from "@/lib/format";
import { replaceAllText } from "@/lib/compat";
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
    <Card className="h-full min-w-0 overflow-hidden">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <p className="mt-3 min-w-0 font-heading text-[clamp(1.45rem,1.9vw,2.25rem)] font-semibold leading-[0.94] tracking-tight [overflow-wrap:anywhere]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">{detail}</p>
    </Card>
  );
}

export function CompareWorkspace() {
  const { active, comparison, saved, setActivePreset, setComparisonPreset, loadSaved } = useScenarioStore();
  const { run: runActive, summary: baseline } = useSimulationRunner();
  const { run: runComparison, summary: stress } = useSimulationRunner();
  const baselineDiagnostics = analyzeScenario(active);
  const comparisonDiagnostics = analyzeScenario(comparison);
  const baselineFinancing = getCurrentFinancing(active);
  const comparisonFinancing = getCurrentFinancing(comparison);
  const comparePayload =
    baseline && stress ? buildComparisonPayload(active, comparison, baseline, stress) : null;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      runActive(active);
      runComparison(comparison);
    }, 250);
    return () => window.clearTimeout(timeout);
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
          {saved.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {saved.slice(0, 4).map((snapshot) => (
                <button
                  key={`baseline-${snapshot.id}`}
                  type="button"
                  onClick={() => loadSaved(snapshot.id, "active")}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-slate-600 hover:border-primary/40 hover:text-slate-950"
                >
                  Load {snapshot.name}
                </button>
              ))}
            </div>
          ) : null}
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
          {saved.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {saved.slice(0, 4).map((snapshot) => (
                <button
                  key={`comparison-${snapshot.id}`}
                  type="button"
                  onClick={() => loadSaved(snapshot.id, "comparison")}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-slate-600 hover:border-primary/40 hover:text-slate-950"
                >
                  Load {snapshot.name}
                </button>
              ))}
            </div>
          ) : null}
        </Card>
      </div>

      {baseline && stress ? (
        <div className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
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
                    {replaceAllText(active.currentRoundKind, "_", " ")} vs {replaceAllText(comparison.currentRoundKind, "_", " ")}
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
            <Card className="lg:col-span-2">
              <h2 className="font-heading text-xl font-semibold">Decision matrix</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm text-slate-700">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                      <th className="px-3 py-2">Metric</th>
                      <th className="px-3 py-2">Baseline</th>
                      <th className="px-3 py-2">Comparison</th>
                      <th className="px-3 py-2">Delta</th>
                      <th className="px-3 py-2">Why it matters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        label: "Current investor ownership",
                        baseline: formatPercent(comparePayload?.baseline.deterministic.currentInvestorOwnership ?? 0),
                        comparison: formatPercent(comparePayload?.comparison.deterministic.currentInvestorOwnership ?? 0),
                        delta: formatPercent(
                          (comparePayload?.comparison.deterministic.currentInvestorOwnership ?? 0) -
                            (comparePayload?.baseline.deterministic.currentInvestorOwnership ?? 0),
                        ),
                        note: "This is the cleanest bridge between check size and eventual fund outcome.",
                      },
                      {
                        label: "Break-even exit",
                        baseline: formatCurrency(comparePayload?.baseline.deterministic.breakEvenExit ?? 0),
                        comparison: formatCurrency(comparePayload?.comparison.deterministic.breakEvenExit ?? 0),
                        delta: formatCurrency(
                          (comparePayload?.comparison.deterministic.breakEvenExit ?? 0) -
                            (comparePayload?.baseline.deterministic.breakEvenExit ?? 0),
                        ),
                        note: "Lower is better for the investor because less exit scale is needed to avoid loss.",
                      },
                      {
                        label: "Return-the-fund exit",
                        baseline: formatCurrency(comparePayload?.baseline.deterministic.returnTheFundExit ?? 0),
                        comparison: formatCurrency(comparePayload?.comparison.deterministic.returnTheFundExit ?? 0),
                        delta: formatCurrency(
                          (comparePayload?.comparison.deterministic.returnTheFundExit ?? 0) -
                            (comparePayload?.baseline.deterministic.returnTheFundExit ?? 0),
                        ),
                        note: "This is the real fund-level hurdle for a lead check.",
                      },
                      {
                        label: "Founder median proceeds",
                        baseline: formatCurrency(comparePayload?.baseline.simulation.founder.median ?? 0),
                        comparison: formatCurrency(comparePayload?.comparison.simulation.founder.median ?? 0),
                        delta: formatCurrency(
                          (comparePayload?.comparison.simulation.founder.median ?? 0) -
                            (comparePayload?.baseline.simulation.founder.median ?? 0),
                        ),
                        note: "Founder upside is where valuation, dilution, preferences, and timing all meet.",
                      },
                      {
                        label: "Founder below 20%",
                        baseline: formatPercent(
                          comparePayload?.baseline.simulation.founder.ownershipThresholds[1]?.probability ?? 0,
                        ),
                        comparison: formatPercent(
                          comparePayload?.comparison.simulation.founder.ownershipThresholds[1]?.probability ?? 0,
                        ),
                        delta: formatPercent(
                          (comparePayload?.comparison.simulation.founder.ownershipThresholds[1]?.probability ?? 0) -
                            (comparePayload?.baseline.simulation.founder.ownershipThresholds[1]?.probability ?? 0),
                        ),
                        note: "This exposes how fast the founder falls into venture-scale dilution territory.",
                      },
                      {
                        label: "Employee underwater",
                        baseline: formatPercent(comparePayload?.baseline.simulation.employee.underwaterProbability ?? 0),
                        comparison: formatPercent(comparePayload?.comparison.simulation.employee.underwaterProbability ?? 0),
                        delta: formatPercent(
                          (comparePayload?.comparison.simulation.employee.underwaterProbability ?? 0) -
                            (comparePayload?.baseline.simulation.employee.underwaterProbability ?? 0),
                        ),
                        note: "This tells you whether the option story is usable or mostly cosmetic.",
                      },
                      {
                        label: "Post-close runway",
                        baseline: `${safeFixed(comparePayload?.baseline.operator.postRaiseRunwayMonths ?? 0, 1)} months`,
                        comparison: `${safeFixed(comparePayload?.comparison.operator.postRaiseRunwayMonths ?? 0, 1)} months`,
                        delta: `${safeFixed(
                          (comparePayload?.comparison.operator.postRaiseRunwayMonths ?? 0) -
                          (comparePayload?.baseline.operator.postRaiseRunwayMonths ?? 0), 1)} months`,
                        note: "Headline financing only matters if it actually buys survival time.",
                      },
                      {
                        label: "Acqui-hire founder proceeds",
                        baseline: formatCurrency(comparePayload?.baseline.capTable.currentWaterfalls[0]?.founderProceeds ?? 0),
                        comparison: formatCurrency(comparePayload?.comparison.capTable.currentWaterfalls[0]?.founderProceeds ?? 0),
                        delta: formatCurrency(
                          (comparePayload?.comparison.capTable.currentWaterfalls[0]?.founderProceeds ?? 0) -
                            (comparePayload?.baseline.capTable.currentWaterfalls[0]?.founderProceeds ?? 0),
                        ),
                        note: "Downside waterfall differences often matter more than headline valuation gaps.",
                      },
                    ].map((row) => (
                      <tr key={row.label} className="rounded-panel bg-slate-50">
                        <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">{row.label}</td>
                        <td className="px-3 py-3">{row.baseline}</td>
                        <td className="px-3 py-3">{row.comparison}</td>
                        <td className="px-3 py-3 font-semibold text-slate-900">{row.delta}</td>
                        <td className="rounded-r-2xl px-3 py-3 text-slate-600">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <div className="grid gap-4 lg:col-span-2 xl:grid-cols-2">
              <TermSheetComparatorChart
                title="Term-sheet A/B: Founder net by exit"
                data={comparePayload?.termSheetCurve ?? []}
                baselineKey="baselineFounderNet"
                comparisonKey="comparisonFounderNet"
                baselineLabel={active.name}
                comparisonLabel={comparison.name}
                formatter={formatCurrency}
              />
              <TermSheetComparatorChart
                title="Term-sheet A/B: Investor proceeds by exit"
                data={comparePayload?.termSheetCurve ?? []}
                baselineKey="baselineInvestorProceeds"
                comparisonKey="comparisonInvestorProceeds"
                baselineLabel={active.name}
                comparisonLabel={comparison.name}
                formatter={formatCurrency}
              />
            </div>
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
