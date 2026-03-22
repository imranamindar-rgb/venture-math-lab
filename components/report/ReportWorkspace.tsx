"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useScenarioStore } from "@/lib/state/scenario-store";
import { useSimulationRunner } from "@/components/simulator/useSimulationRunner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SupportBadge } from "@/components/ui/SupportBadge";
import { buildScenarioCsv, buildScenarioMarkdown } from "@/lib/export";
import { formatCurrency, formatMultiple, formatPercent } from "@/lib/format";
import { buildScenarioBasePayload, buildScenarioReportPayload } from "@/lib/reporting";
import { buildScenarioReportUrl, decodeScenarioFromShare, getEncodedScenarioFromLocation } from "@/lib/share";
import { ScenarioConfig } from "@/lib/sim/types";

function downloadCsv(filename: string, payload: string) {
  const blob = new Blob([payload], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadText(filename: string, payload: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([payload], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ReportWorkspace() {
  const active = useScenarioStore((state) => state.active);
  const hasHydrated = useScenarioStore((state) => state.hasHydrated);
  const updateActive = useScenarioStore((state) => state.updateActive);
  const { run, summary, loading, error: simulationError } = useSimulationRunner();
  const [sharedConfig, setSharedConfig] = useState<ScenarioConfig | null>(null);
  const [shareStatus, setShareStatus] = useState<"checking" | "active" | "shared" | "error">("checking");
  const [shareError, setShareError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const encoded = getEncodedScenarioFromLocation(window.location);
    if (!encoded) {
      setShareStatus("active");
      return;
    }

    const decoded = decodeScenarioFromShare(encoded);
    if (decoded.ok) {
      setSharedConfig(decoded.config);
      setShareStatus("shared");
      return;
    }

    setShareError(decoded.error);
    setShareStatus("error");
  }, []);

  const reportConfig = shareStatus === "shared" && sharedConfig ? sharedConfig : shareStatus === "active" && hasHydrated ? active : null;

  useEffect(() => {
    if (!reportConfig) {
      return;
    }
    run(reportConfig);
  }, [reportConfig, run]);

  const reportState = useMemo(() => {
    if (!reportConfig) {
      return { basePayload: null, payload: null, renderError: null as string | null };
    }

    try {
      const basePayload = buildScenarioBasePayload(reportConfig);
      const payload = summary ? buildScenarioReportPayload(reportConfig, summary) : null;
      return { basePayload, payload, renderError: null as string | null };
    } catch {
      return {
        basePayload: null,
        payload: null,
        renderError: "The report could not render this scenario in the current browser. Try loading the scenario back into the calculator or using a shorter share link.",
      };
    }
  }, [reportConfig, summary]);

  const { basePayload, payload, renderError } = reportState;

  const handleCopyShareLink = async () => {
    if (typeof window === "undefined" || typeof navigator === "undefined" || !reportConfig) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildScenarioReportUrl(reportConfig, window.location.origin));
      setCopyStatus("Share link copied.");
    } catch {
      setCopyStatus("Copy failed. Use the browser address bar instead.");
    }
  };

  if (shareStatus === "checking" || (shareStatus === "active" && !hasHydrated)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Scenario report</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold">Board-ready venture math summary</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Loading the scenario state before the report runs.
          </p>
          <p className="mt-4 text-sm text-slate-500" aria-live="polite">
            Loading scenario...
          </p>
        </Card>
      </div>
    );
  }

  if (shareStatus === "error") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Scenario report</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold">Board-ready venture math summary</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{shareError}</p>
          <div className="mt-5">
            <Link
              href="/calculator"
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Open calculator
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (renderError || simulationError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Scenario report</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold">Board-ready venture math summary</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{renderError ?? simulationError}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/calculator"
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Open calculator
            </Link>
            {reportConfig ? (
              <Button
                variant="secondary"
                onClick={() => {
                  updateActive(reportConfig);
                  setCopyStatus("Scenario loaded into the live workspace.");
                }}
              >
                Load into workspace
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }

  if (!basePayload || !reportConfig) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Scenario report</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold">Board-ready venture math summary</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">No active scenario is loaded yet.</p>
          <div className="mt-5">
            <Link
              href="/calculator"
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Open calculator
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { diagnostics, deterministic, capTable, operator, topWarnings } = basePayload;
  const simulation = payload?.simulation;
  const executiveSummary = payload?.executiveSummary ?? basePayload.executiveSummary;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:px-0">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Scenario report</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold">Board-ready venture math summary</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            This report packages the active scenario into assumptions, deterministic thresholds, Monte Carlo risk, and cap-table consequences that can travel outside the app.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleCopyShareLink}>
            Copy share link
          </Button>
          {shareStatus === "shared" ? (
            <Button
              variant="secondary"
              onClick={() => {
                updateActive(reportConfig);
                setCopyStatus("Shared scenario loaded into the live workspace.");
              }}
            >
              Load into workspace
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => downloadCsv(`${reportConfig.id}-report.csv`, buildScenarioCsv(reportConfig, summary ?? undefined))}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              downloadText(
                `${reportConfig.id}-memo.md`,
                buildScenarioMarkdown(reportConfig, summary ?? undefined),
                "text/markdown;charset=utf-8",
              )
            }
          >
            Export Memo
          </Button>
          <Button onClick={() => window.print()}>Print report</Button>
        </div>
      </div>
      {copyStatus ? <p className="mt-3 text-sm text-slate-500 print:hidden">{copyStatus}</p> : null}

      <div className="mt-8 space-y-6 print:mt-0">
        <Card className="print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Active scenario</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold">{reportConfig.name}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{reportConfig.description}</p>
            </div>
            <SupportBadge level={diagnostics.supportLevel} label={diagnostics.supportLabel} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Current post-money</p>
              <p className="mt-2 font-heading text-2xl font-semibold">{formatCurrency(deterministic.currentPostMoney)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Founder median</p>
              <p className="mt-2 font-heading text-2xl font-semibold">
                {simulation ? formatCurrency(simulation.founder.median) : "Running"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Investor return-the-fund</p>
              <p className="mt-2 font-heading text-2xl font-semibold">
                {simulation ? formatPercent(simulation.investor.returnTheFundProbability) : "Running"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Support status</p>
              <p className="mt-2 font-heading text-2xl font-semibold">{diagnostics.supportLevel}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Source: {shareStatus === "shared" ? "self-contained share link" : "active workspace state"}.
          </p>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <Card className="print:shadow-none">
            <h3 className="font-heading text-xl font-semibold">Executive summary</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {executiveSummary.map((line) => (
                <div key={line} className="rounded-2xl bg-slate-50 px-4 py-3">
                  {line}
                </div>
              ))}
            </div>
          </Card>

          <Card className="print:shadow-none">
            <h3 className="font-heading text-xl font-semibold">Assumptions and metadata</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Run ID</p>
                <p className="mt-2 font-semibold text-slate-900">{payload?.runId ?? basePayload.runId}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Methodology version</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {payload?.methodologyVersion ?? basePayload.methodologyVersion}
                </p>
              </div>
              {diagnostics.assumptions.map((assumption) => (
                <div key={assumption.label} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{assumption.label}</p>
                  <p className="mt-2 font-semibold text-slate-900">{assumption.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="print:shadow-none">
            <h3 className="font-heading text-xl font-semibold">Interpretation and limits</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <p>{diagnostics.summary}</p>
              {topWarnings.map((warning) => (
                <div key={warning} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  {warning}
                </div>
              ))}
              <p className="text-slate-600">
                This report is decision support. It models per-series preferred seniority and standard participating structures, but it still excludes bespoke charter language, tax treatment, and fully custom legal waterfalls.
              </p>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="print:shadow-none">
            <h3 className="font-heading text-xl font-semibold">Deterministic thresholds</h3>
            <dl className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Current investor ownership</dt>
                <dd className="font-semibold">{formatPercent(deterministic.currentInvestorOwnership)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Benchmark next step-up</dt>
                <dd className="font-semibold">{formatMultiple(deterministic.benchmarkNextStepUp)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Break-even exit</dt>
                <dd className="font-semibold">{formatCurrency(deterministic.breakEvenExit)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Return-the-fund exit</dt>
                <dd className="font-semibold">{formatCurrency(deterministic.returnTheFundExit)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="print:shadow-none">
            <h3 className="font-heading text-xl font-semibold">Monte Carlo takeaways</h3>
            <dl className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Founder below 20%</dt>
                <dd className="font-semibold">
                  {simulation ? formatPercent(simulation.founder.ownershipThresholds[1]?.probability ?? 0) : "Running"}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Employee underwater</dt>
                <dd className="font-semibold">
                  {simulation ? formatPercent(simulation.employee.underwaterProbability) : "Running"}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Investor 10x+</dt>
                <dd className="font-semibold">
                  {simulation ? formatPercent(simulation.investor.moicThresholds[2]?.probability ?? 0) : "Running"}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Power-law spread</dt>
                <dd className="font-semibold">{simulation ? formatMultiple(simulation.meanVsMedianSpread) : "Running"}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-slate-500">
              {simulation
                ? `Monte Carlo seed ${simulation.seed} across ${simulation.iterations.toLocaleString("en-US")} paths.`
                : loading
                  ? "Running Monte Carlo section..."
                  : "Monte Carlo section waiting for the active scenario to run."}
            </p>
            {simulation ? (
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>
                  Founder median 95% CI {formatCurrency(simulation.confidence.founderMedian.lower)} to{" "}
                  {formatCurrency(simulation.confidence.founderMedian.upper)}.
                </p>
                <p>
                  Investor return-the-fund 95% CI {formatPercent(simulation.confidence.investorReturnTheFundProbability.lower)} to{" "}
                  {formatPercent(simulation.confidence.investorReturnTheFundProbability.upper)}.
                </p>
              </div>
            ) : null}
          </Card>

          <Card className="print:shadow-none">
            <h3 className="font-heading text-xl font-semibold">Waterfall checkpoints</h3>
            <div className="mt-4 space-y-3">
              {capTable.currentWaterfalls.map((scenario) => (
                <div key={scenario.label} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{scenario.label}</p>
                  <p className="mt-1">Exit value {formatCurrency(scenario.exitValue)}</p>
                  <p className="mt-2">Founder {formatCurrency(scenario.founderProceeds)}</p>
                  <p>Modeled investor {formatCurrency(scenario.investorProceeds)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
          <Card className="print:shadow-none">
            <h3 className="font-heading text-xl font-semibold">Operator reality check</h3>
            <dl className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Runway months</dt>
                <dd className="font-semibold">{Number.isFinite(operator.runwayMonths) ? operator.runwayMonths.toFixed(1) : "∞"}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Months to next benchmark round</dt>
                <dd className="font-semibold">{operator.monthsToNextBenchmark}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Financing gap</dt>
                <dd className="font-semibold">{formatCurrency(operator.financingGap)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Buffered gap</dt>
                <dd className="font-semibold">{formatCurrency(operator.bufferGap)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Burn multiple</dt>
                <dd className="font-semibold">{formatMultiple(operator.burnMultiple)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Post-close runway</dt>
                <dd className="font-semibold">{Number.isFinite(operator.postRaiseRunwayMonths) ? operator.postRaiseRunwayMonths.toFixed(1) : "∞"} months</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Working capital</dt>
                <dd className="font-semibold">{formatCurrency(operator.workingCapital)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="print:shadow-none">
            <h3 className="font-heading text-xl font-semibold">Operating warnings</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {operator.warnings.map((warning) => (
                <li key={warning} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  {warning}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <Card className="print:shadow-none">
            <h3 className="font-heading text-xl font-semibold">Preferred stack by series</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm text-slate-700">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-3 py-2">Series</th>
                    <th className="px-3 py-2">Ownership</th>
                    <th className="px-3 py-2">Preference</th>
                  </tr>
                </thead>
                <tbody>
                  {capTable.currentRows
                    .filter((row) => row.category === "preferred")
                    .map((row) => (
                      <tr key={row.label} className="rounded-panel bg-slate-50">
                        <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">{row.label}</td>
                        <td className="px-3 py-3">{formatPercent(row.ownership)}</td>
                        <td className="rounded-r-2xl px-3 py-3">{formatCurrency(row.preferenceAmount)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="print:shadow-none">
            <h3 className="font-heading text-xl font-semibold">Statement bridge</h3>
            <div className="mt-4 space-y-3">
              {operator.cashFlowBridge.map((line) => (
                <div key={line.label} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-900">{line.label}</p>
                    <p className="font-semibold text-slate-900">{formatCurrency(line.value)}</p>
                  </div>
                  <p className="mt-2 leading-6 text-slate-600">{line.note}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="print:shadow-none">
          <h3 className="font-heading text-xl font-semibold">Median financing path</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm text-slate-700">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-3 py-2">Stage</th>
                  <th className="px-3 py-2">Pre-money</th>
                  <th className="px-3 py-2">Round</th>
                  <th className="px-3 py-2">Founder</th>
                  <th className="px-3 py-2">Investor</th>
                </tr>
              </thead>
              <tbody>
                {deterministic.roundProjection.map((round) => (
                  <tr key={round.stage} className="rounded-panel bg-slate-50">
                    <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">{round.label}</td>
                    <td className="px-3 py-3">{formatCurrency(round.preMoney)}</td>
                    <td className="px-3 py-3">{formatCurrency(round.roundSize)}</td>
                    <td className="px-3 py-3">{formatPercent(round.founderOwnership)}</td>
                    <td className="rounded-r-2xl px-3 py-3">{formatPercent(round.investorOwnership)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
