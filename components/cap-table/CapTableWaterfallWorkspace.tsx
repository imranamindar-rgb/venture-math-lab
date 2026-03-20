"use client";

import { useMemo } from "react";

import { ActiveScenarioPanel } from "@/components/workspace/ActiveScenarioPanel";
import { Card } from "@/components/ui/Card";
import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/format";
import { summarizeCapTableWaterfall } from "@/lib/engines/cap-table-waterfall/analysis";
import { useScenarioStore } from "@/lib/state/scenario-store";

function PositionTable({
  title,
  rows,
  totalShares,
}: {
  title: string;
  rows: ReturnType<typeof summarizeCapTableWaterfall>["currentRows"];
  totalShares: number;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-heading text-lg font-semibold">{title}</h3>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          Fully diluted {formatCompactNumber(totalShares)}
        </p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-sm text-slate-700">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
              <th className="px-3 py-2">Holder</th>
              <th className="px-3 py-2">Shares</th>
              <th className="px-3 py-2">Ownership</th>
              <th className="px-3 py-2">Preference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="rounded-panel bg-slate-50">
                <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">{row.label}</td>
                <td className="px-3 py-3">{formatCompactNumber(row.shares)}</td>
                <td className="px-3 py-3">{formatPercent(row.ownership)}</td>
                <td className="rounded-r-2xl px-3 py-3">{row.preferenceAmount > 0 ? formatCurrency(row.preferenceAmount) : "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function WaterfallCard({
  title,
  scenarios,
}: {
  title: string;
  scenarios: ReturnType<typeof summarizeCapTableWaterfall>["currentWaterfalls"];
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {scenarios.map((scenario) => (
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
            <dl className="mt-4 grid gap-3 md:grid-cols-2">
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
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Modeled investor</dt>
                <dd className="mt-2 min-w-0 font-heading text-[clamp(1.35rem,1.9vw,2rem)] font-semibold leading-[0.95] tracking-tight text-slate-900 [overflow-wrap:anywhere]">
                  {formatCurrency(scenario.investorProceeds)}
                </dd>
              </div>
              <div className="min-w-0 overflow-hidden rounded-2xl bg-white px-3 py-3">
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Prior preferred</dt>
                <dd className="mt-2 min-w-0 font-heading text-[clamp(1.35rem,1.9vw,2rem)] font-semibold leading-[0.95] tracking-tight text-slate-900 [overflow-wrap:anywhere]">
                  {formatCurrency(scenario.priorInvestorProceeds)}
                </dd>
              </div>
              <div className="min-w-0 overflow-hidden rounded-2xl bg-white px-3 py-3">
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Note payout</dt>
                <dd className="mt-2 min-w-0 font-heading text-[clamp(1.35rem,1.9vw,2rem)] font-semibold leading-[0.95] tracking-tight text-slate-900 [overflow-wrap:anywhere]">
                  {formatCurrency(scenario.noteProceeds)}
                </dd>
              </div>
              <div className="min-w-0 overflow-hidden rounded-2xl bg-white px-3 py-3">
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">SAFE payout</dt>
                <dd className="mt-2 min-w-0 font-heading text-[clamp(1.35rem,1.9vw,2rem)] font-semibold leading-[0.95] tracking-tight text-slate-900 [overflow-wrap:anywhere]">
                  {formatCurrency(scenario.safeProceeds)}
                </dd>
              </div>
            </dl>
            {scenario.founderBreakdown.length > 1 ? (
              <div className="mt-4 min-w-0 rounded-2xl bg-white px-3 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Founder split</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {scenario.founderBreakdown.map((founder) => (
                    <li key={founder.id} className="flex items-center justify-between gap-4">
                      <span className="min-w-0">{founder.name}</span>
                      <span className="shrink-0 text-right font-semibold text-slate-900">
                        {formatCurrency(founder.proceeds)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {scenario.seriesBreakdown.length > 0 ? (
              <div className="mt-4 min-w-0 rounded-2xl bg-white px-3 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Preferred series</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {scenario.seriesBreakdown.map((series) => (
                    <li key={series.id} className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{series.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">
                          {series.structure} / seniority {series.seniority}
                        </p>
                      </div>
                      <span className="shrink-0 text-right font-semibold text-slate-900">{formatCurrency(series.payout)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CapTableWaterfallWorkspace() {
  const active = useScenarioStore((state) => state.active);
  const summary = useMemo(() => summarizeCapTableWaterfall(active), [active]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 2xl:grid-cols-[0.95fr,1.35fr]">
        <ActiveScenarioPanel
          modeLabel="Cap table and waterfall engine"
          title="Cap Table Lab"
          guidanceTitle="Ownership mechanics with legal-economic consequences"
          guidanceBody="This engine isolates the fully diluted cap table, unpriced instrument conversion, and liquidation waterfall so you can see who gets diluted, who gets protected, and when common actually participates."
          hintWhenReady={`Current fully diluted base ${formatCompactNumber(summary.fullyDilutedShares)} shares.`}
        />

        <div className="space-y-6">
          <Card>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Cap table and waterfall output</p>
            <h2 className="mt-2 font-heading text-2xl font-semibold">Current stack versus qualified-financing view</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Compare the current fully diluted stack to the as-converted view, then inspect how modest and strong exits
              distribute proceeds across common, preferred, and note holders.
            </p>
          </Card>

          <div className="grid gap-4 2xl:grid-cols-2">
            <PositionTable title="Current cap table" rows={summary.currentRows} totalShares={summary.fullyDilutedShares} />
            <PositionTable
              title="As-converted preview"
              rows={summary.convertedRows}
              totalShares={summary.convertedFullyDilutedShares}
            />
          </div>

          <div className="grid gap-4 2xl:grid-cols-2">
            <WaterfallCard title="Current stack exit scenarios" scenarios={summary.currentWaterfalls} />
            <WaterfallCard title="As-converted exit scenarios" scenarios={summary.convertedWaterfalls} />
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
        </div>
      </div>
    </div>
  );
}
