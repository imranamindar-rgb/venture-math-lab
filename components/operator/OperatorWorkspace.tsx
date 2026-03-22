"use client";

import { useMemo } from "react";

import { ActiveScenarioPanel } from "@/components/workspace/ActiveScenarioPanel";
import { Card } from "@/components/ui/Card";
import { ProbabilityChart } from "@/components/charts/ProbabilityChart";
import { summarizeOperatorIntelligence } from "@/lib/engines/operator-intelligence";
import { formatCurrency, formatMultiple, safeFixed } from "@/lib/format";
import { useScenarioStore } from "@/lib/state/scenario-store";

export function OperatorWorkspace() {
  const active = useScenarioStore((state) => state.active);
  const summary = useMemo(() => summarizeOperatorIntelligence(active), [active]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Operator output</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">Cash discipline before capital strategy</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            A company can look venture-backable on cap-table math and still miss the next financing window if cash, burn, working capital, and financing friction are out of line.
          </p>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
          <Card className="min-w-0 overflow-hidden p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Runway</p>
              <p className="mt-3 min-w-0 font-heading text-[clamp(1.9rem,2.5vw,3rem)] font-semibold leading-[0.92] tracking-tight [overflow-wrap:anywhere]">
                {safeFixed(summary.runwayMonths, 1)} months
              </p>
              <p className="mt-2 text-sm text-slate-600">{summary.runwayBand} coverage versus the next benchmark financing step</p>
            </Card>
            <Card className="min-w-0 overflow-hidden p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Post-close runway</p>
              <p className="mt-3 min-w-0 font-heading text-[clamp(1.9rem,2.5vw,3rem)] font-semibold leading-[0.92] tracking-tight [overflow-wrap:anywhere]">
                {safeFixed(summary.postRaiseRunwayMonths, 1)} months
              </p>
              <p className="mt-2 text-sm text-slate-600">Runway if the modeled financing closes net of transaction fees</p>
            </Card>
            <Card className="min-w-0 overflow-hidden p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Financing gap</p>
              <p className="mt-3 min-w-0 font-heading text-[clamp(1.9rem,2.5vw,3rem)] font-semibold leading-[0.92] tracking-tight [overflow-wrap:anywhere]">
                {formatCurrency(summary.financingGap)}
              </p>
              <p className="mt-2 text-sm text-slate-600">Cash shortfall to simply reach the next benchmark round</p>
            </Card>
            <Card className="min-w-0 overflow-hidden p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Buffered gap</p>
              <p className="mt-3 min-w-0 font-heading text-[clamp(1.9rem,2.5vw,3rem)] font-semibold leading-[0.92] tracking-tight [overflow-wrap:anywhere]">
                {formatCurrency(summary.bufferGap)}
              </p>
              <p className="mt-2 text-sm text-slate-600">Shortfall including the target post-round safety buffer</p>
            </Card>
            <Card className="min-w-0 overflow-hidden p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Burn multiple</p>
              <p className="mt-3 min-w-0 font-heading text-[clamp(1.9rem,2.5vw,3rem)] font-semibold leading-[0.92] tracking-tight [overflow-wrap:anywhere]">
                {formatMultiple(summary.burnMultiple)}
              </p>
              <p className="mt-2 text-sm text-slate-600">Annualized burn divided by projected ARR growth over the next year</p>
            </Card>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1.05fr,0.95fr]">
          <ProbabilityChart title="Operating Readiness Signals" data={summary.operatingSignals} />
          <Card>
            <h3 className="font-heading text-lg font-semibold">Operating checkpoints</h3>
              <dl className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                  <dt>Months to next benchmark round</dt>
                  <dd className="font-semibold">{summary.monthsToNextBenchmark}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                  <dt>Annualized revenue</dt>
                  <dd className="font-semibold">{formatCurrency(summary.annualizedRevenue)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                  <dt>Projected revenue at next round</dt>
                  <dd className="font-semibold">{formatCurrency(summary.projectedRevenueAtNextRound)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                  <dt>Gross profit annualized</dt>
                  <dd className="font-semibold">{formatCurrency(summary.grossProfitAnnualized)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                  <dt>Operating cash flow annualized</dt>
                  <dd className="font-semibold">{formatCurrency(summary.operatingCashFlowAnnualized)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                  <dt>Free cash flow annualized</dt>
                  <dd className="font-semibold">{formatCurrency(summary.freeCashFlowAnnualized)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                  <dt>Gross margin band</dt>
                  <dd className="font-semibold">{summary.grossMarginBand}</dd>
                </div>
              </dl>
          </Card>
        </div>

        <div className="grid gap-4 2xl:grid-cols-2">
          <Card>
            <h3 className="font-heading text-lg font-semibold">Simplified balance-sheet bridge</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm text-slate-700">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                      <th className="px-3 py-2">Line</th>
                      <th className="px-3 py-2">Current</th>
                      <th className="px-3 py-2">If round closes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.balanceSheetBridge.map((line) => (
                      <tr key={line.label} className="rounded-panel bg-slate-50 align-top">
                        <td className="rounded-l-2xl px-3 py-3">
                          <p className="font-semibold text-slate-900">{line.label}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{line.note}</p>
                        </td>
                        <td className="px-3 py-3">{formatCurrency(line.currentValue)}</td>
                        <td className="rounded-r-2xl px-3 py-3">{formatCurrency(line.postRaiseValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </Card>

          <Card>
            <h3 className="font-heading text-lg font-semibold">Cash-flow bridge to next benchmark</h3>
              <div className="mt-4 space-y-3">
                {summary.cashFlowBridge.map((line) => (
                  <div key={line.label} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-slate-900">{line.label}</p>
                      <p className="font-semibold text-slate-900">{formatCurrency(line.value)}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{line.note}</p>
                  </div>
                ))}
              </div>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="min-w-0 overflow-hidden p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Working capital</p>
              <p className="mt-3 min-w-0 font-heading text-[clamp(1.9rem,2.5vw,3rem)] font-semibold leading-[0.92] tracking-tight [overflow-wrap:anywhere]">
                {formatCurrency(summary.workingCapital)}
              </p>
              <p className="mt-2 text-sm text-slate-600">Current assets minus current liabilities in the simplified bridge</p>
            </Card>
            <Card className="min-w-0 overflow-hidden p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Quick ratio</p>
              <p className="mt-3 min-w-0 font-heading text-[clamp(1.9rem,2.5vw,3rem)] font-semibold leading-[0.92] tracking-tight [overflow-wrap:anywhere]">
                {safeFixed(summary.quickRatio, 2)}x
              </p>
              <p className="mt-2 text-sm text-slate-600">Liquid assets versus short-term obligations</p>
            </Card>
            <Card className="min-w-0 overflow-hidden p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Net financing proceeds</p>
              <p className="mt-3 min-w-0 font-heading text-[clamp(1.9rem,2.5vw,3rem)] font-semibold leading-[0.92] tracking-tight [overflow-wrap:anywhere]">
                {formatCurrency(summary.netFinancingProceeds)}
              </p>
              <p className="mt-2 text-sm text-slate-600">{summary.financingClassification} net of modeled transaction fees</p>
            </Card>
        </div>

        <Card>
          <h3 className="font-heading text-lg font-semibold">Interpretation flags</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {summary.warnings.map((warning) => (
                <li key={warning} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  {warning}
                </li>
              ))}
            </ul>
        </Card>

        <ActiveScenarioPanel
          defaultCollapsed
          modeLabel="Operator intelligence layer"
          title="Operator Lab"
          guidanceTitle="Check survival first, then open the assumptions"
          guidanceBody="The numbers above answer the core founder question: can this company survive to the next financing window? Open the controls only when you need to adjust the cash story."
          hintWhenReady={`Financing gap ${formatCurrency(summary.bufferGap)} to reach the next round with buffer.`}
        />
      </div>
    </div>
  );
}
