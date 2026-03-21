"use client";

import { useMemo } from "react";

import { OwnershipChart } from "@/components/charts/OwnershipChart";
import { ActiveScenarioPanel } from "@/components/workspace/ActiveScenarioPanel";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatMultiple, formatPercent } from "@/lib/format";
import { summarizeDeterministicFinance } from "@/lib/engines/deterministic-finance";
import { useScenarioStore } from "@/lib/state/scenario-store";

function MetricCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <Card className="min-w-0 overflow-hidden p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 min-w-0 font-heading text-[clamp(1.9rem,2.5vw,3rem)] font-semibold leading-[0.92] tracking-tight text-foreground [overflow-wrap:anywhere]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{caption}</p>
    </Card>
  );
}

export function DeterministicCalculatorWorkspace() {
  const active = useScenarioStore((state) => state.active);
  const summary = useMemo(() => summarizeDeterministicFinance(active), [active]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 2xl:grid-cols-[0.95fr,1.35fr]">
        <ActiveScenarioPanel
          modeLabel="Deterministic finance engine"
          title="Deal Calculator"
          guidanceTitle="Inspectable formulas first"
          guidanceBody="This engine turns the current scenario into clean post-money math, deterministic dilution projections, and return thresholds you can inspect line by line before you touch Monte Carlo uncertainty."
          hintWhenReady={`Current return-the-fund threshold ${formatCurrency(summary.returnTheFundExit)}.`}
        />

        <div className="space-y-6">
          <Card>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Deterministic output</p>
            <h2 className="mt-2 font-heading text-2xl font-semibold">Transparent venture math before path uncertainty</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              The deterministic engine uses the current cap table and benchmark stage medians to answer whether the deal
              clears basic ownership, dilution, and return tests before stochastic outcomes widen the range.
            </p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <MetricCard
              label="Current post-money"
              value={formatCurrency(summary.currentPostMoney)}
              caption={`Modeled investor owns ${formatPercent(summary.currentInvestorOwnership)} on the current instrument.`}
            />
            <MetricCard
              label="Next-step benchmark"
              value={formatMultiple(summary.benchmarkNextStepUp)}
              caption="Median next-stage pre-money divided by the current post-money reference."
            />
            <MetricCard
              label="Break-even exit"
              value={formatCurrency(summary.breakEvenExit)}
              caption="Exit value required for the modeled investor to clear 1x on deterministic ownership."
            />
            <MetricCard
              label="Return the fund"
              value={formatCurrency(summary.returnTheFundExit)}
              caption="Single-company exit value needed to distribute the entire modeled fund."
            />
          </div>

          <div className="grid gap-4 2xl:grid-cols-[1.2fr,0.8fr]">
            <OwnershipChart data={summary.ownershipSeries} />
            <Card>
              <h3 className="font-heading text-lg font-semibold">Formula notes</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                {summary.formulas.map((formula) => (
                  <div key={formula.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{formula.label}</p>
                    <p className="mt-2 font-mono text-xs text-slate-500">{formula.formula}</p>
                    <p className="mt-3 text-base font-semibold text-slate-900">
                      {formula.format === "percent" ? formatPercent(formula.value) : formatCurrency(formula.value)}
                    </p>
                    <p className="mt-2 leading-6 text-slate-600">{formula.note}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="font-heading text-lg font-semibold">Median financing path</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm text-slate-700">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-3 py-2">Stage</th>
                    <th className="px-3 py-2">Months</th>
                    <th className="px-3 py-2">Pre-money</th>
                    <th className="px-3 py-2">Round</th>
                    <th className="px-3 py-2">Step-up</th>
                    <th className="px-3 py-2">Founder</th>
                    <th className="px-3 py-2">Investor</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.roundProjection.map((round) => (
                    <tr key={round.stage} className="rounded-panel bg-slate-50">
                      <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">{round.label}</td>
                      <td className="px-3 py-3">{round.monthsElapsed}</td>
                      <td className="px-3 py-3">{formatCurrency(round.preMoney)}</td>
                      <td className="px-3 py-3">{formatCurrency(round.roundSize)}</td>
                      <td className="px-3 py-3">{formatMultiple(round.stepUpRatio)}</td>
                      <td className="px-3 py-3">{formatPercent(round.founderOwnership)}</td>
                      <td className="rounded-r-2xl px-3 py-3">{formatPercent(round.investorOwnership)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-4 2xl:grid-cols-[1.05fr,0.95fr]">
            <Card>
              <h3 className="font-heading text-lg font-semibold">Waterfall checkpoints</h3>
              <div className="mt-4 space-y-3">
                {summary.waterfallScenarios.map((scenario) => (
                  <div key={scenario.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{scenario.label}</p>
                        <p className="mt-1 text-sm text-slate-500">Exit value {formatCurrency(scenario.exitValue)}</p>
                      </div>
                      <div className="rounded-full border border-border bg-white px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {scenario.preferredStructure}
                      </div>
                    </div>
                    <dl className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-white px-3 py-3">
                        <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Founder</dt>
                        <dd className="mt-2 font-semibold text-slate-900">{formatCurrency(scenario.founderProceeds)}</dd>
                      </div>
                      <div className="rounded-2xl bg-white px-3 py-3">
                        <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Employee</dt>
                        <dd className="mt-2 font-semibold text-slate-900">{formatCurrency(scenario.employeeProceeds)}</dd>
                      </div>
                      <div className="rounded-2xl bg-white px-3 py-3">
                        <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Investor</dt>
                        <dd className="mt-2 font-semibold text-slate-900">{formatCurrency(scenario.investorProceeds)}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-heading text-lg font-semibold">Interpretation flags</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {summary.warnings.map((warning) => (
                  <li key={warning} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    {warning}
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Deterministic math is the clean baseline. Use the Monte Carlo engine when timing, failure, down rounds,
                and exit tails matter more than the median path.
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
