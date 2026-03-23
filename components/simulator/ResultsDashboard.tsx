"use client";

import { Card } from "@/components/ui/Card";
import { InfoTip } from "@/components/ui/InfoTip";
import { HistogramChart } from "@/components/charts/HistogramChart";
import { OwnershipChart } from "@/components/charts/OwnershipChart";
import { ProbabilityChart } from "@/components/charts/ProbabilityChart";
import { formatCompactNumber, formatCurrency, formatMultiple, formatPercent } from "@/lib/format";
import { SimulationSummary } from "@/lib/sim/types";

function confidenceLabel(lower: number, upper: number, formatter: (value: number) => string) {
  return `${formatter(lower)} to ${formatter(upper)}`;
}

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

export function ResultsDashboard({ summary }: { summary: SimulationSummary }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        <MetricCard
          label={`Founder ${summary.founder.riskBand}`}
          value={formatCurrency(summary.founder.median)}
          caption={`P10 ${formatCurrency(summary.founder.p10)} to P90 ${formatCurrency(summary.founder.p90)}. 95% stability range ${confidenceLabel(summary.confidence.founderMedian.lower, summary.confidence.founderMedian.upper, formatCurrency)}.`}
        />
        <MetricCard
          label={`Employee ${summary.employee.riskBand}`}
          value={formatCurrency(summary.employee.median)}
          caption={`Underwater risk ${formatPercent(summary.employee.underwaterProbability)}. 95% stability range ${confidenceLabel(summary.confidence.employeeUnderwaterProbability.lower, summary.confidence.employeeUnderwaterProbability.upper, formatPercent)}.`}
        />
        <MetricCard
          label={`Investor ${summary.investor.riskBand}`}
          value={formatCurrency(summary.investor.median)}
          caption={`Return-the-fund odds ${formatPercent(summary.investor.returnTheFundProbability)}. 95% stability range ${confidenceLabel(summary.confidence.investorReturnTheFundProbability.lower, summary.confidence.investorReturnTheFundProbability.upper, formatPercent)}.`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr,0.9fr]">
        <OwnershipChart data={summary.ownershipSeries} />
        <ProbabilityChart title="Risk Layers" data={summary.riskLayers} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <HistogramChart title="Founder Net Proceeds Distribution" data={summary.exitHistogram} />
        <HistogramChart title="Investor MOIC Distribution" data={summary.investorHistogram} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h3 className="font-heading text-lg font-semibold">Founder signals</h3>
          <dl className="mt-4 space-y-3 text-sm text-slate-700">
            {summary.founder.ownershipThresholds.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                <dt>{metric.label}</dt>
                <dd className="font-semibold">{formatPercent(metric.probability)}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card>
          <h3 className="font-heading text-lg font-semibold">Employee signals</h3>
          <dl className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
              <dt>Worthless or illiquid</dt>
              <dd className="font-semibold">{formatPercent(summary.employee.worthlessProbability)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
              <dt>Underwater grant</dt>
              <dd className="font-semibold">{formatPercent(summary.employee.underwaterProbability)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
              <dt>Gross value / exercise cost median</dt>
              <dd className="font-semibold">{formatMultiple(summary.employee.exerciseCoverageMedian)}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h3 className="font-heading text-lg font-semibold">Investor signals</h3>
          <dl className="mt-4 space-y-3 text-sm text-slate-700">
            {summary.investor.moicThresholds.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                <dt>{metric.label}</dt>
                <dd className="font-semibold">{formatPercent(metric.probability)}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
              <dt>Reserve usage median</dt>
              <dd className="font-semibold">{formatCompactNumber(summary.investor.reserveUtilizationMedian)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <h3 className="font-heading text-lg font-semibold">Outcome mix</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {summary.outcomeMix.map((metric) => (
              <li key={metric.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                <span>{metric.label}</span>
                <span className="font-semibold">{formatPercent(metric.probability)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Mean-to-median spread is {formatMultiple(summary.meanVsMedianSpread)}. The wider that gap gets, the more the
            economics rely on rare power-law wins rather than typical outcomes.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Founder median 95% stability range {confidenceLabel(summary.confidence.founderMedian.lower, summary.confidence.founderMedian.upper, formatCurrency)}.
            Investor return-the-fund 95% stability range{" "}
            {confidenceLabel(
              summary.confidence.investorReturnTheFundProbability.lower,
              summary.confidence.investorReturnTheFundProbability.upper,
              formatPercent,
            )}
            .
          </p>
        </Card>
        <Card>
          <h3 className="font-heading text-lg font-semibold">Warnings and scope limits</h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {summary.warnings.map((warning) => (
              <li key={warning} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                {warning}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
