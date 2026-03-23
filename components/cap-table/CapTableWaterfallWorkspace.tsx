"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ActiveScenarioPanel } from "@/components/workspace/ActiveScenarioPanel";
import { Card } from "@/components/ui/Card";
import { SupportBadge } from "@/components/ui/SupportBadge";
import { Button, EditScenarioButton } from "@/components/ui/Button";
import { summarizeCapTableWaterfall } from "@/lib/engines/cap-table-waterfall/analysis";
import { getCurrentFinancing } from "@/lib/current-financing";
import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/format";
import { analyzeScenario } from "@/lib/scenario-diagnostics";
import { replaceAllText } from "@/lib/compat";
import { useScenarioStore } from "@/lib/state/scenario-store";

type CapTableSummary = ReturnType<typeof summarizeCapTableWaterfall>;
type PositionRows = CapTableSummary["currentRows"];
type WaterfallRows = CapTableSummary["currentWaterfalls"];

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function PositionTable({
  title,
  rows,
  totalShares,
}: {
  title: string;
  rows: PositionRows;
  totalShares: number;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-xl font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Fully diluted shares: {formatCompactNumber(totalShares)}
          </p>
        </div>
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
              <tr key={`${title}-${row.label}`} className="rounded-panel bg-slate-50">
                <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">{row.label}</td>
                <td className="px-3 py-3">{formatCompactNumber(row.shares)}</td>
                <td className="px-3 py-3">{formatPercent(row.ownership)}</td>
                <td className="rounded-r-2xl px-3 py-3">
                  {row.preferenceAmount > 0 ? formatCurrency(row.preferenceAmount) : "None"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function WaterfallSection({
  title,
  scenarios,
}: {
  title: string;
  scenarios: WaterfallRows;
}) {
  return (
    <Card>
      <h3 className="font-heading text-xl font-semibold">{title}</h3>
      <div className="mt-4 space-y-4">
        {scenarios.map((scenario) => (
          <div key={`${title}-${scenario.label}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{scenario.label}</p>
                <p className="mt-1 text-sm text-slate-500">Exit value {formatCurrency(scenario.exitValue)}</p>
              </div>
              <div className="rounded-full border border-border bg-white px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                {scenario.preferredStructure}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Founder common"
                value={formatCurrency(scenario.founderProceeds)}
                detail="Common proceeds paid to founders at exit, excluding any pre-exit secondary sales."
              />
              <MetricCard
                label="Employee net"
                value={formatCurrency(scenario.employeeProceeds)}
                detail="Net employee proceeds after exercise cost is deducted from gross common value."
              />
              <MetricCard
                label="Modeled investor"
                value={formatCurrency(scenario.investorProceeds)}
                detail="Total proceeds for the modeled investor. SAFE and note claims are included here, not additive."
              />
              <MetricCard
                label="Prior investors"
                value={formatCurrency(scenario.priorInvestorProceeds)}
                detail="Total proceeds paid to the prior preferred stack ahead of founder common."
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Reconciliation</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li className="flex items-center justify-between gap-4">
                    <span>Exit value</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(scenario.exitValue)}</span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span>Allocated in waterfall</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(scenario.exitAllocated)}</span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span>Difference</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(scenario.exitGap)}</span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span>Employee strike cost</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(scenario.employeeExerciseCost)}</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Modeled investor detail</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li className="flex items-center justify-between gap-4">
                    <span>Preferred and common stack</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(scenario.modeledPreferredProceeds)}</span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span>Note claim included above</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(scenario.noteProceeds)}</span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span>SAFE claim included above</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(scenario.safeProceeds)}</span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span>Secondary common</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(scenario.secondaryCommonProceeds)}</span>
                  </li>
                </ul>
              </div>
            </div>

            {scenario.founderBreakdown.length > 1 ? (
              <div className="mt-4 rounded-2xl bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Founder split</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {scenario.founderBreakdown.map((founder) => (
                    <li key={founder.id} className="flex items-center justify-between gap-4">
                      <span>{founder.name}</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(founder.proceeds)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {scenario.seriesBreakdown.length > 0 ? (
              <div className="mt-4 rounded-2xl bg-white px-4 py-4">
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
                      <span className="shrink-0 font-semibold text-slate-900">{formatCurrency(series.payout)}</span>
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

function ConversionBridge({ summary }: { summary: CapTableSummary }) {
  if (summary.safeConversionBridge) {
    const bridge = summary.safeConversionBridge;
    return (
      <Card>
        <h3 className="font-heading text-xl font-semibold">Post-money SAFE dilution bridge</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          The SAFE preview converts at the better of the post-money cap or the qualified round price. Dilution lands on existing holders before the new priced round buys in.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Conversion math</p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center justify-between gap-4">
                <span>Qualified financing pre-money</span>
                <span className="font-semibold text-slate-900">{formatCurrency(bridge.qualifiedPreMoney)}</span>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span>SAFE issued shares</span>
                <span className="font-semibold text-slate-900">{formatCompactNumber(bridge.issuedShares)}</span>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span>Cap-based shares</span>
                <span className="font-semibold text-slate-900">{formatCompactNumber(bridge.capIssuedShares)}</span>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span>Round-price shares</span>
                <span className="font-semibold text-slate-900">{formatCompactNumber(bridge.roundIssuedShares)}</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Ownership movement</p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center justify-between gap-4">
                <span>Founders</span>
                <span className="font-semibold text-slate-900">
                  {formatPercent(bridge.founderBefore)} to {formatPercent(bridge.founderAfter)}
                </span>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span>Employees</span>
                <span className="font-semibold text-slate-900">
                  {formatPercent(bridge.employeeBefore)} to {formatPercent(bridge.employeeAfter)}
                </span>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span>Prior investors</span>
                <span className="font-semibold text-slate-900">
                  {formatPercent(bridge.priorBefore)} to {formatPercent(bridge.priorAfter)}
                </span>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span>SAFE ownership after conversion</span>
                <span className="font-semibold text-slate-900">{formatPercent(bridge.safeOwnershipAfter)}</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    );
  }

  if (summary.noteConversionBridge) {
    const bridge = summary.noteConversionBridge;
    return (
      <Card>
        <h3 className="font-heading text-xl font-semibold">Convertible note bridge</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Notes stay senior in weak exits, then convert at the better of the cap or discount in the qualified-financing preview.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MetricCard
            label="Qualified financing pre-money"
            value={formatCurrency(bridge.qualifiedPreMoney)}
            detail="The round price the note compares itself against."
          />
          <MetricCard
            label="Accrued principal"
            value={formatCurrency(bridge.accruedPrincipal)}
            detail="Principal plus modeled accrued interest at preview conversion."
          />
          <MetricCard
            label="Conversion price"
            value={formatCurrency(bridge.conversionPrice)}
            detail={`Conversion is currently driven by the ${bridge.conversionDriver}.`}
          />
        </div>
      </Card>
    );
  }

  return null;
}

export function CapTableWaterfallWorkspace() {
  const active = useScenarioStore((state) => state.active);
  const setActivePreset = useScenarioStore((state) => state.setActivePreset);

  const pageState = useMemo(() => {
    try {
      const diagnostics = analyzeScenario(active);
      const financing = getCurrentFinancing(active);
      const summary = summarizeCapTableWaterfall(active);
      const currentPreferredOverhang = summary.currentRows
        .filter((row) => row.preferenceAmount > 0)
        .reduce((total, row) => total + row.preferenceAmount, 0);
      const convertedShareDelta = summary.convertedFullyDilutedShares - summary.fullyDilutedShares;

      return {
        diagnostics,
        financing,
        summary,
        currentPreferredOverhang,
        convertedShareDelta,
        error: null as string | null,
      };
    } catch (error) {
      return {
        diagnostics: null,
        financing: null,
        summary: null,
        currentPreferredOverhang: 0,
        convertedShareDelta: 0,
        error:
          error instanceof Error
            ? error.message
            : "The cap-table engine hit an unexpected browser-side error while reading the active scenario.",
      };
    }
  }, [active]);

  if (!pageState.summary || !pageState.diagnostics || !pageState.financing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Cap table and waterfall output</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">This scenario could not render in the cap-table engine</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            The cap-table page has been simplified, but the active scenario still hit a browser-side exception before this route could finish rendering. Reset to the standard scenario and reopen the page.
          </p>
          <p className="mt-3 text-sm text-slate-500">{pageState.error}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => setActivePreset("nvca_standard")}>Reset to standard scenario</Button>
            <Link
              href="/calculator"
              className="inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/40 hover:bg-amber-50"
            >
              Open calculator
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { diagnostics, financing, summary, currentPreferredOverhang, convertedShareDelta } = pageState;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Cap table and waterfall output</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold">Who owns the company now, and who gets paid at exit?</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This page is now deliberately narrower. It focuses on current ownership, as-converted ownership, conversion bridges, and exit proceeds. The full scenario editor is available below, but it is no longer the first thing you have to parse.
              </p>
              <EditScenarioButton className="mt-4" />
            </div>
            <SupportBadge level={diagnostics.supportLevel} label={diagnostics.supportLabel} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Reference post-money"
              value={formatCurrency(financing.referencePostMoney)}
              detail="This anchors the cap-table exit scenarios shown below."
            />
            <MetricCard
              label="Current instrument"
              value={replaceAllText(active.currentRoundKind, "_", " ")}
              detail="The instrument type driving the current ownership and conversion preview."
            />
            <MetricCard
              label="Current preference overhang"
              value={formatCurrency(currentPreferredOverhang)}
              detail="Preference stack sitting ahead of common in modest exits."
            />
            <MetricCard
              label="As-converted share delta"
              value={formatCompactNumber(convertedShareDelta)}
              detail="Extra fully diluted shares created when current unpriced instruments convert."
            />
          </div>
        </Card>

        <div className="grid gap-4 2xl:grid-cols-2">
          <PositionTable title="Current cap table" rows={summary.currentRows} totalShares={summary.fullyDilutedShares} />
          <PositionTable
            title="As-converted preview"
            rows={summary.convertedRows}
            totalShares={summary.convertedFullyDilutedShares}
          />
        </div>

        <ConversionBridge summary={summary} />

        <div className="grid gap-6 2xl:grid-cols-2">
          <WaterfallSection title="Current stack exit scenarios" scenarios={summary.currentWaterfalls} />
          <WaterfallSection title="As-converted exit scenarios" scenarios={summary.convertedWaterfalls} />
        </div>

        <Card>
          <h3 className="font-heading text-xl font-semibold">Interpretation notes</h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {summary.warnings.map((warning) => (
              <li key={warning} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                {warning}
              </li>
            ))}
          </ul>
        </Card>

        <ActiveScenarioPanel
          modeLabel="Cap-table controls"
          title="Adjust the financing setup behind the ownership stack"
          guidanceTitle="Cap-table interpretation"
          guidanceBody="Use the page above to read the ownership stack first. Only open the full controls when you want to change the deal terms or assumptions behind the stack."
          hintWhenReady="Start from the current and as-converted tables, then read the exit scenarios below them."
          defaultCollapsed
        />
      </div>
    </div>
  );
}
