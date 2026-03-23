"use client";

import { useEffect, useMemo, useState } from "react";

import { DealReturnHeatmap } from "@/components/charts/DealReturnHeatmap";
import { OwnershipChart } from "@/components/charts/OwnershipChart";
import { LiquidationDeadZoneChart } from "@/components/charts/LiquidationDeadZoneChart";
import { ActiveScenarioPanel } from "@/components/workspace/ActiveScenarioPanel";
import { Card } from "@/components/ui/Card";
import { EditScenarioButton } from "@/components/ui/Button";
import { InfoTip } from "@/components/ui/InfoTip";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { formatCurrency, formatMultiple, formatPercent } from "@/lib/format";
import { evaluateDeterministicExitScenario, summarizeDeterministicFinance } from "@/lib/engines/deterministic-finance";
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
      <div className="flex items-center gap-2">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <InfoTip content={caption} label={`${label} explanation`} />
      </div>
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
  const [testExitValue, setTestExitValue] = useState(summary.threeXExit);
  useEffect(() => {
    setTestExitValue(summary.threeXExit);
  }, [summary.threeXExit]);
  const takeHome = useMemo(
    () => evaluateDeterministicExitScenario(active, Math.max(1, testExitValue)),
    [active, testExitValue],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Deterministic output</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">Start with the answer, then inspect the math</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            This page leads with the headline thresholds founders and investors actually care about, then lets you open the full scenario controls only if the answer needs more tuning.
          </p>
          <EditScenarioButton className="mt-4" />
        </Card>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
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
            label="Founder makes $10M"
            value={formatCurrency(summary.founderTenMillionExit)}
            caption="Exit value where founder net proceeds first clear $10M under the modeled waterfall."
          />
          <MetricCard
            label="Return the fund"
            value={formatCurrency(summary.returnTheFundExit)}
            caption={`Single-company exit value needed to distribute the modeled fund of ${formatCurrency(active.investor.fundSize)}.`}
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

        <div className="grid gap-4 2xl:grid-cols-[1.05fr,0.95fr]">
          <Card>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg font-semibold">What do I take home at exit X?</h3>
              <InfoTip
                content="This solves the founder, employee, and investor take-home amounts against the deterministic terminal cap table and waterfall."
                label="Take-home calculator help"
              />
            </div>
            <div className="mt-4 max-w-sm">
              <MoneyInput value={testExitValue} onValueChange={setTestExitValue} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Founder net</p>
                <p className="mt-2 font-heading text-2xl font-semibold">{formatCurrency(takeHome.founderNet)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Employee net</p>
                <p className="mt-2 font-heading text-2xl font-semibold">{formatCurrency(takeHome.employeeNet)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Modeled investor</p>
                <p className="mt-2 font-heading text-2xl font-semibold">{formatCurrency(takeHome.investorProceeds)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Prior investors</p>
                <p className="mt-2 font-heading text-2xl font-semibold">{formatCurrency(takeHome.priorInvestorProceeds)}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Structure at this exit: {takeHome.preferredStructure}. Founder secondary already realized before exit is
              included in founder net.
            </p>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg font-semibold">Option-pool shuffle</h3>
              <InfoTip
                content="This shows how much founders lose when the same option-pool top-up happens pre-money instead of after the round."
                label="Option pool shuffle help"
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Founder after pre-money pool</p>
                <p className="mt-2 font-heading text-2xl font-semibold">
                  {formatPercent(summary.optionPoolShuffle.preMoneyFounderOwnership)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Founder after post-money pool</p>
                <p className="mt-2 font-heading text-2xl font-semibold">
                  {formatPercent(summary.optionPoolShuffle.postMoneyFounderOwnership)}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-slate-700">
              <p>
                Founder ownership delta:{" "}
                <span className="font-semibold text-slate-900">
                  {formatPercent(summary.optionPoolShuffle.founderOwnershipDelta)}
                </span>
              </p>
              <p>
                Founder proceeds delta at {formatCurrency(summary.optionPoolShuffle.illustrativeExitValue)} exit:{" "}
                <span className="font-semibold text-slate-900">
                  {formatCurrency(summary.optionPoolShuffle.founderProceedsDeltaAtIllustrativeExit)}
                </span>
              </p>
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
          <Card className="min-w-0 overflow-hidden">
            <h3 className="font-heading text-lg font-semibold">Waterfall checkpoints</h3>
              <div className="mt-4 space-y-3">
                {summary.waterfallScenarios.map((scenario) => (
                  <div key={scenario.label} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{scenario.label}</p>
                        <p className="mt-1 text-sm text-slate-500">Exit value {formatCurrency(scenario.exitValue)}</p>
                      </div>
                      <div className="rounded-full border border-border bg-white px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {scenario.preferredStructure}
                      </div>
                    </div>
                    <dl className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                      <div className="min-w-0 overflow-hidden rounded-2xl bg-white px-3 py-3">
                        <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Founder</dt>
                        <dd className="mt-2 min-w-0 font-heading text-[clamp(1.35rem,1.9vw,2rem)] font-semibold leading-[0.95] tracking-tight text-slate-900 [overflow-wrap:anywhere]">
                          {formatCurrency(scenario.founderProceeds)}
                        </dd>
                      </div>
                      <div className="min-w-0 overflow-hidden rounded-2xl bg-white px-3 py-3">
                        <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Employee</dt>
                        <dd className="mt-2 min-w-0 font-heading text-[clamp(1.35rem,1.9vw,2rem)] font-semibold leading-[0.95] tracking-tight text-slate-900 [overflow-wrap:anywhere]">
                          {formatCurrency(scenario.employeeProceeds)}
                        </dd>
                      </div>
                      <div className="min-w-0 overflow-hidden rounded-2xl bg-white px-3 py-3">
                        <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Investor</dt>
                        <dd className="mt-2 min-w-0 font-heading text-[clamp(1.35rem,1.9vw,2rem)] font-semibold leading-[0.95] tracking-tight text-slate-900 [overflow-wrap:anywhere]">
                          {formatCurrency(scenario.investorProceeds)}
                        </dd>
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

        <LiquidationDeadZoneChart
          data={summary.liquidationDeadZone.points}
          deadZoneEndsAt={summary.liquidationDeadZone.deadZoneEndsAt}
        />

        <DealReturnHeatmap
          anchorExitValue={summary.dealReturnHeatmap.anchorExitValue}
          exitValues={summary.dealReturnHeatmap.exitValues}
          years={summary.dealReturnHeatmap.years}
          cells={summary.dealReturnHeatmap.cells}
        />

        <ActiveScenarioPanel
          defaultCollapsed
          modeLabel="Deterministic finance engine"
          title="Deal Calculator"
          guidanceTitle="Adjust the scenario only after you see the threshold math"
          guidanceBody="The deterministic answer cards above are meant to give you a fast first take. Open the controls when you need to inspect assumptions, change the instrument, or tune ownership."
          hintWhenReady={`Current return-the-fund threshold ${formatCurrency(summary.returnTheFundExit)} assuming a modeled fund size of ${formatCurrency(active.investor.fundSize)}.`}
        />
      </div>
    </div>
  );
}
