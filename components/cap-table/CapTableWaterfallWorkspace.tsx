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
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Founder common</dt>
                <dd className="mt-2 min-w-0 font-heading text-[clamp(1.35rem,1.9vw,2rem)] font-semibold leading-[0.95] tracking-tight text-slate-900 [overflow-wrap:anywhere]">
                  {formatCurrency(scenario.founderProceeds)}
                </dd>
              </div>
              <div className="min-w-0 overflow-hidden rounded-2xl bg-white px-3 py-3">
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Employee gross</dt>
                <dd className="mt-2 min-w-0 font-heading text-[clamp(1.35rem,1.9vw,2rem)] font-semibold leading-[0.95] tracking-tight text-slate-900 [overflow-wrap:anywhere]">
                  {formatCurrency(scenario.employeeGrossProceeds)}
                </dd>
              </div>
              <div className="min-w-0 overflow-hidden rounded-2xl bg-white px-3 py-3">
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Modeled investor total</dt>
                <dd className="mt-2 min-w-0 font-heading text-[clamp(1.35rem,1.9vw,2rem)] font-semibold leading-[0.95] tracking-tight text-slate-900 [overflow-wrap:anywhere]">
                  {formatCurrency(scenario.investorProceeds)}
                </dd>
              </div>
              <div className="min-w-0 overflow-hidden rounded-2xl bg-white px-3 py-3">
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Prior investor total</dt>
                <dd className="mt-2 min-w-0 font-heading text-[clamp(1.35rem,1.9vw,2rem)] font-semibold leading-[0.95] tracking-tight text-slate-900 [overflow-wrap:anywhere]">
                  {formatCurrency(scenario.priorInvestorProceeds)}
                </dd>
              </div>
              <div className="min-w-0 overflow-hidden rounded-2xl bg-white px-3 py-3">
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Secondary common</dt>
                <dd className="mt-2 min-w-0 font-heading text-[clamp(1.35rem,1.9vw,2rem)] font-semibold leading-[0.95] tracking-tight text-slate-900 [overflow-wrap:anywhere]">
                  {formatCurrency(scenario.secondaryCommonProceeds)}
                </dd>
              </div>
              <div className="min-w-0 overflow-hidden rounded-2xl bg-white px-3 py-3">
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Employee net after strike</dt>
                <dd className="mt-2 min-w-0 font-heading text-[clamp(1.35rem,1.9vw,2rem)] font-semibold leading-[0.95] tracking-tight text-slate-900 [overflow-wrap:anywhere]">
                  {formatCurrency(scenario.employeeProceeds)}
                </dd>
              </div>
            </dl>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="min-w-0 rounded-2xl bg-white px-3 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Modeled investor detail</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li className="flex items-center justify-between gap-4">
                    <span className="min-w-0">Preferred and common stack</span>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {formatCurrency(scenario.modeledPreferredProceeds)}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span className="min-w-0">Note claim included above</span>
                    <span className="shrink-0 font-semibold text-slate-900">{formatCurrency(scenario.noteProceeds)}</span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span className="min-w-0">SAFE claim included above</span>
                    <span className="shrink-0 font-semibold text-slate-900">{formatCurrency(scenario.safeProceeds)}</span>
                  </li>
                </ul>
              </div>
              <div className="min-w-0 rounded-2xl bg-white px-3 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Exit reconciliation</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li className="flex items-center justify-between gap-4">
                    <span className="min-w-0">Exit value</span>
                    <span className="shrink-0 font-semibold text-slate-900">{formatCurrency(scenario.exitValue)}</span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span className="min-w-0">Allocated in waterfall</span>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {formatCurrency(scenario.exitAllocated)}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span className="min-w-0">Difference</span>
                    <span className="shrink-0 font-semibold text-slate-900">{formatCurrency(scenario.exitGap)}</span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span className="min-w-0">Employee strike cost</span>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {formatCurrency(scenario.employeeExerciseCost)}
                    </span>
                  </li>
                  {scenario.founderRealizedSecondary > 0 || scenario.employeeRealizedSecondary > 0 ? (
                    <li className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-slate-700">
                      Realized secondary sold before exit is excluded from the exit-value reconciliation.
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
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
      <div className="space-y-6">
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Cap table and waterfall output</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">See who gets paid before you touch the legal details</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            This page now leads with the ownership and exit consequences. Open the full scenario controls only when you want to change the instrument, stack, or operating assumptions behind the cap table.
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

          {summary.safeConversionBridge ? (
            <Card>
              <h3 className="font-heading text-lg font-semibold">Post-money SAFE dilution bridge</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                The SAFE preview converts at the better of the post-money cap or the qualified round price. The dilution
                falls on the existing holders before the new priced-round investor buys in.
              </p>
              <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Conversion mechanics</p>
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-center justify-between gap-4">
                      <span>Qualified financing pre-money</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(summary.safeConversionBridge.qualifiedPreMoney)}</span>
                    </li>
                    <li className="flex items-center justify-between gap-4">
                      <span>SAFE issued shares</span>
                      <span className="font-semibold text-slate-900">{formatCompactNumber(summary.safeConversionBridge.issuedShares)}</span>
                    </li>
                    <li className="flex items-center justify-between gap-4">
                      <span>Cap-based shares</span>
                      <span className="font-semibold text-slate-900">{formatCompactNumber(summary.safeConversionBridge.capIssuedShares)}</span>
                    </li>
                    <li className="flex items-center justify-between gap-4">
                      <span>Round-price shares</span>
                      <span className="font-semibold text-slate-900">{formatCompactNumber(summary.safeConversionBridge.roundIssuedShares)}</span>
                    </li>
                    <li className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-slate-700">
                      SAFE conversion is currently driven by the{" "}
                      <span className="font-semibold text-slate-900">
                        {summary.safeConversionBridge.conversionDriver === "cap" ? "post-money cap" : "priced round"}
                      </span>
                      .
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Dilution lands on existing holders</p>
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-center justify-between gap-4">
                      <span>Founders</span>
                      <span className="font-semibold text-slate-900">
                        {formatPercent(summary.safeConversionBridge.founderBefore)} to {formatPercent(summary.safeConversionBridge.founderAfter)}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-4">
                      <span>Employees</span>
                      <span className="font-semibold text-slate-900">
                        {formatPercent(summary.safeConversionBridge.employeeBefore)} to {formatPercent(summary.safeConversionBridge.employeeAfter)}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-4">
                      <span>Prior investors</span>
                      <span className="font-semibold text-slate-900">
                        {formatPercent(summary.safeConversionBridge.priorBefore)} to {formatPercent(summary.safeConversionBridge.priorAfter)}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-4">
                      <span>SAFE ownership after conversion</span>
                      <span className="font-semibold text-slate-900">{formatPercent(summary.safeConversionBridge.safeOwnershipAfter)}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          ) : null}

          {summary.noteConversionBridge ? (
            <Card>
              <h3 className="font-heading text-lg font-semibold">Note conversion bridge</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                The note preview accrues interest, stays senior to equity in weak exits, and converts at the better of the cap or discount.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Qualified financing pre-money</p>
                  <p className="mt-2 font-semibold text-slate-900">{formatCurrency(summary.noteConversionBridge.qualifiedPreMoney)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Accrued principal</p>
                  <p className="mt-2 font-semibold text-slate-900">{formatCurrency(summary.noteConversionBridge.accruedPrincipal)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Winning conversion rule</p>
                  <p className="mt-2 font-semibold text-slate-900">{summary.noteConversionBridge.conversionDriver}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Share price {formatCurrency(summary.noteConversionBridge.conversionPrice)}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

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

        <ActiveScenarioPanel
          defaultCollapsed
          modeLabel="Cap table and waterfall engine"
          title="Cap Table Lab"
          guidanceTitle="Use the payout view first"
          guidanceBody="Founders and investors should react to who gets diluted and who gets paid before they wade into the full scenario editor. Open the controls when you want to change the stack."
          hintWhenReady={`Current fully diluted base ${formatCompactNumber(summary.fullyDilutedShares)} shares.`}
        />
      </div>
    </div>
  );
}
