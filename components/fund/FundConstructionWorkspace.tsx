"use client";

import { useEffect, useMemo, useState } from "react";

import { stageOrder, FundingStage, MarketOverlay, SectorOverlay } from "@/lib/sim/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InfoTip } from "@/components/ui/InfoTip";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { FundTimelineChart } from "@/components/charts/FundTimelineChart";
import { HistogramChart } from "@/components/charts/HistogramChart";
import { ProbabilityChart } from "@/components/charts/ProbabilityChart";
import { ReserveConstraintMap } from "@/components/charts/ReserveConstraintMap";
import { TornadoChart } from "@/components/charts/TornadoChart";
import {
  getDefaultFundConstructionConfig,
  getFundPresetOptions,
  sanitizeFundConstructionConfig,
  summarizeFundConstruction,
} from "@/lib/engines/fund-construction";
import { getVintageBenchmarks } from "@/data/vintage-benchmarks";
import { formatCurrency, formatMultiple, formatPercent } from "@/lib/format";

export function FundConstructionWorkspace() {
  const [config, setConfig] = useState(getDefaultFundConstructionConfig());
  const [showControls, setShowControls] = useState(false);
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState("");
  const presetOptions = useMemo(() => getFundPresetOptions(), []);
  const safeConfig = useMemo(() => sanitizeFundConstructionConfig(config), [config]);
  const summary = useMemo(() => summarizeFundConstruction(safeConfig), [safeConfig]);
  const benchmarkOptions = useMemo(() => getVintageBenchmarks(safeConfig.stage), [safeConfig.stage]);
  const selectedBenchmark = benchmarkOptions.find((benchmark) => benchmark.id === selectedBenchmarkId) ?? benchmarkOptions[0];

  useEffect(() => {
    setSelectedBenchmarkId(benchmarkOptions[0]?.id ?? "");
  }, [benchmarkOptions]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Fund construction lab</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold">Whole-fund venture math</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Start with the portfolio answer, not the full parameter wall. Adjust the fund construction only when the headline outcomes tell you the current setup is off.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {presetOptions.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setConfig(preset.config)}
                className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 hover:border-primary/40 hover:text-slate-950"
              >
                {preset.name}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {presetOptions.find((preset) => preset.config.fundSize === config.fundSize && preset.config.stage === config.stage)?.note ??
              "Custom fund scenario."}
          </p>
          <div className="mt-4">
            <Button variant={showControls ? "secondary" : "primary"} onClick={() => setShowControls((current) => !current)}>
              {showControls ? "Hide fund controls" : "Adjust fund model"}
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <Card className="min-w-0 overflow-hidden p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Investable capital</p>
            <p className="mt-3 min-w-0 font-heading text-[clamp(1.9rem,2.5vw,3rem)] font-semibold leading-[0.92] tracking-tight [overflow-wrap:anywhere]">
              {formatCurrency(summary.investableCapital)}
            </p>
            <p className="mt-2 text-sm text-slate-600">After fee drag over a 10-year fund life</p>
          </Card>
          <Card className="min-w-0 overflow-hidden p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Modeled companies</p>
            <p className="mt-3 min-w-0 font-heading text-[clamp(1.9rem,2.5vw,3rem)] font-semibold leading-[0.92] tracking-tight [overflow-wrap:anywhere]">
              {summary.modeledCompanyCount}
            </p>
            <p className="mt-2 text-sm text-slate-600">Supported by the initial deployment budget</p>
          </Card>
          <Card className="min-w-0 overflow-hidden p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Median net TVPI</p>
            <p className="mt-3 min-w-0 font-heading text-[clamp(1.9rem,2.5vw,3rem)] font-semibold leading-[0.92] tracking-tight [overflow-wrap:anywhere]">
              {formatMultiple(summary.netTVPIMedian)}
            </p>
            <p className="mt-2 text-sm text-slate-600">Net of modeled carry but before taxes at the LP level</p>
          </Card>
          <Card className="min-w-0 overflow-hidden p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Median net IRR</p>
            <p className="mt-3 min-w-0 font-heading text-[clamp(1.9rem,2.5vw,3rem)] font-semibold leading-[0.92] tracking-tight [overflow-wrap:anywhere]">
              {formatPercent(summary.netIrrMedian)}
            </p>
            <p className="mt-2 text-sm text-slate-600">Approximate, based on simulated exit timing</p>
          </Card>
        </div>

        {summary.netTVPIMedian < 1 ? (
          <Card className="border-amber-200 bg-amber-50">
            <h2 className="font-heading text-xl font-semibold text-slate-900">Default-fund framing</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              This scenario currently shows a sub-1.0x median net TVPI because reserve drag, check size, and company count are interacting pessimistically. Treat it as a construction warning, not a blanket claim that seed funds are uneconomic.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Current setup supports {summary.modeledCompanyCount} initial companies, reserves {formatCurrency(summary.reserveBudget)}, and leaves median net TVPI at {formatMultiple(summary.netTVPIMedian)}.
            </p>
          </Card>
        ) : null}

        <div className="grid gap-4 2xl:grid-cols-[1.05fr,0.95fr]">
          <HistogramChart title="Net TVPI Distribution" data={summary.netMultipleHistogram} />
          <ProbabilityChart title="Fund Concentration and Outcomes" data={summary.concentrationMetrics} />
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1.15fr,0.85fr]">
          <FundTimelineChart
            data={summary.timeline}
            benchmark={selectedBenchmark ? { label: selectedBenchmark.label, timeline: selectedBenchmark.timeline } : undefined}
          />
          <Card>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-xl font-semibold">Vintage benchmark overlay</h2>
              <InfoTip
                content="These overlays are contextual reference curves for venture-vintage behavior, meant to calibrate the simulated J-curve rather than act as a live benchmark feed."
                label="Vintage benchmark help"
              />
            </div>
            <select
              value={selectedBenchmark?.id ?? ""}
              onChange={(event) => setSelectedBenchmarkId(event.target.value)}
              className="mt-4 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            >
              {benchmarkOptions.map((benchmark) => (
                <option key={benchmark.id} value={benchmark.id}>
                  {benchmark.label}
                </option>
              ))}
            </select>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {selectedBenchmark?.note ?? "No benchmark overlay selected for this stage."}
            </p>
            {selectedBenchmark ? (
              <dl className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                  <dt>Year 5 benchmark DPI</dt>
                  <dd className="font-semibold">
                    {formatMultiple(selectedBenchmark.timeline.find((point) => point.year === 5)?.dpi ?? 0)}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                  <dt>Year 10 benchmark TVPI</dt>
                  <dd className="font-semibold">
                    {formatMultiple(selectedBenchmark.timeline.find((point) => point.year === 10)?.tvpi ?? 0)}
                  </dd>
                </div>
              </dl>
            ) : null}
          </Card>
        </div>

        <div className="grid gap-4 2xl:grid-cols-2">
          <Card>
            <h2 className="font-heading text-xl font-semibold">Fund thresholds</h2>
            <dl className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Management fees</dt>
                <dd className="font-semibold">{formatCurrency(summary.managementFees)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Reserve budget</dt>
                <dd className="font-semibold">{formatCurrency(summary.reserveBudget)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>Follow-on capacity</dt>
                <dd className="font-semibold">{summary.followOnCapacity}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <dt>One company returns fund</dt>
                <dd className="font-semibold">{formatCurrency(summary.oneCompanyReturnFundExit)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="font-heading text-xl font-semibold">Outcome odds</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {summary.netMultipleThresholds.map((metric) => (
                <li key={metric.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                  <span>{metric.label}</span>
                  <span className="font-semibold">{formatPercent(metric.probability)}</span>
                </li>
              ))}
              <li className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <span>Top quartile probability</span>
                <span className="font-semibold">{formatPercent(summary.topQuartileProbability)}</span>
              </li>
              <li className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <span>One company returns fund</span>
                <span className="font-semibold">{formatPercent(summary.oneCompanyReturnsFundProbability)}</span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1.05fr,0.95fr]">
          <Card>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-xl font-semibold">Follow-on and signaling-risk matrix</h2>
              <InfoTip
                content="This compares how full pro rata, selective winner support, and no-follow-on policies change median TVPI, concentration, and the probability that your behavior sends a negative signal to the market."
                label="Follow-on matrix help"
              />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm text-slate-700">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-3 py-2">Strategy</th>
                    <th className="px-3 py-2">Net TVPI</th>
                    <th className="px-3 py-2">Top winner</th>
                    <th className="px-3 py-2">Return fund</th>
                    <th className="px-3 py-2">Signaling risk</th>
                    <th className="px-3 py-2">Ownership defense</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.strategyMatrix.map((row) => (
                    <tr key={row.label} className="rounded-panel bg-slate-50">
                      <td className="rounded-l-2xl px-3 py-3">
                        <p className="font-semibold text-slate-900">{row.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{row.note}</p>
                      </td>
                      <td className="px-3 py-3">{formatMultiple(row.netTVPIMedian)}</td>
                      <td className="px-3 py-3">{formatPercent(row.topWinnerShareMedian)}</td>
                      <td className="px-3 py-3">{formatPercent(row.oneCompanyReturnsFundProbability)}</td>
                      <td className="px-3 py-3">{formatPercent(row.signalingRiskProbability)}</td>
                      <td className="rounded-r-2xl px-3 py-3">{formatPercent(row.ownershipMaintenanceRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <TornadoChart
            title="Net TVPI Sensitivity Tornado"
            data={summary.sensitivity}
            valueFormatter={(value) => `${value > 0 ? "+" : ""}${value.toFixed(2)}x`}
          />
        </div>

        <ReserveConstraintMap
          fundSizes={summary.reserveConstraintMap.fundSizes}
          reserveRatios={summary.reserveConstraintMap.reserveRatios}
          cells={summary.reserveConstraintMap.cells}
          recommendedCell={summary.reserveConstraintMap.recommendedCell}
          note={summary.reserveConstraintMap.note}
        />

        <div className="grid gap-4 2xl:grid-cols-[1.1fr,0.9fr]">
          <Card>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-xl font-semibold">LP fee and carry schedule by year</h2>
              <InfoTip
                content="This shows the median annual fee drag, capital called, gross distributions, carry paid, and net distributions back to LPs."
                label="Fee carry schedule help"
              />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm text-slate-700">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-3 py-2">Year</th>
                    <th className="px-3 py-2">Fees</th>
                    <th className="px-3 py-2">Paid-in</th>
                    <th className="px-3 py-2">Gross dist.</th>
                    <th className="px-3 py-2">Carry</th>
                    <th className="px-3 py-2">Net dist.</th>
                    <th className="px-3 py-2">Cum. net dist.</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.feeCarrySchedule.map((row) => (
                    <tr key={row.year} className="rounded-panel bg-slate-50">
                      <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">{row.year}</td>
                      <td className="px-3 py-3">{formatCurrency(row.feesPaid)}</td>
                      <td className="px-3 py-3">{formatCurrency(row.paidInCapital)}</td>
                      <td className="px-3 py-3">{formatCurrency(row.grossDistributions)}</td>
                      <td className="px-3 py-3">{formatCurrency(row.carryPaid)}</td>
                      <td className="px-3 py-3">{formatCurrency(row.netDistributions)}</td>
                      <td className="rounded-r-2xl px-3 py-3">{formatCurrency(row.cumulativeNetDistributions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-xl font-semibold">Loss-ratio vs concentration</h2>
              <InfoTip
                content="This decomposes whether fund outcomes are being driven by too many losses, too much dependence on a single winner, or both."
                label="Loss ratio decomposition help"
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Median loss ratio</p>
                <p className="mt-2 font-heading text-2xl font-semibold">
                  {formatPercent(summary.lossConcentration.medianLossRatio)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Median loss of capital</p>
                <p className="mt-2 font-heading text-2xl font-semibold">
                  {formatPercent(summary.lossConcentration.medianLossOfCapitalRatio)}
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {summary.lossConcentration.quadrantProbabilities.map((metric) => (
                <li key={metric.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                  <span>{metric.label}</span>
                  <span className="font-semibold">{formatPercent(metric.probability)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {showControls ? (
          <Card>
            <h2 className="font-heading text-xl font-semibold">Fund controls</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <label className="space-y-2 text-sm">
              <span className="flex items-center gap-2 font-heading font-semibold text-foreground">
                <span>Fund size</span>
                <InfoTip content="Total committed capital in the venture fund. This drives fee drag, investable capital, and return-the-fund thresholds." label="Fund size help" />
              </span>
              <MoneyInput
                value={config.fundSize}
                onValueChange={(value) => setConfig((current) => ({ ...current, fundSize: value }))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="flex items-center gap-2 font-heading font-semibold text-foreground">
                <span>Stage focus</span>
                <InfoTip content="The stage where the fund primarily invests. Stage focus changes ownership targets, valuations, and likely outcome distributions." label="Stage focus help" />
              </span>
              <select
                value={config.stage}
                onChange={(event) => setConfig((current) => ({ ...current, stage: event.target.value as FundingStage }))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              >
                {stageOrder.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="flex items-center gap-2 font-heading font-semibold text-foreground">
                <span>Initial check size</span>
                <InfoTip content="Capital deployed into each new portfolio company before any follow-on investing." label="Initial check size help" />
              </span>
              <MoneyInput
                value={config.initialCheckSize}
                onValueChange={(value) => setConfig((current) => ({ ...current, initialCheckSize: value }))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="flex items-center gap-2 font-heading font-semibold text-foreground">
                <span>Follow-on check size</span>
                <InfoTip content="Capital reserved for later rounds when the fund decides to keep backing a winner." label="Follow-on check size help" />
              </span>
              <MoneyInput
                value={config.followOnCheckSize}
                onValueChange={(value) => setConfig((current) => ({ ...current, followOnCheckSize: value }))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-heading font-semibold text-foreground">Reserve ratio</span>
              <input
                type="number"
                step="0.05"
                value={config.reserveRatio}
                onChange={(event) => setConfig((current) => ({ ...current, reserveRatio: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-heading font-semibold text-foreground">Portfolio size</span>
              <input
                type="number"
                value={config.portfolioSize}
                onChange={(event) => setConfig((current) => ({ ...current, portfolioSize: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-heading font-semibold text-foreground">Target ownership</span>
              <input
                type="number"
                step="0.01"
                value={config.targetOwnership}
                onChange={(event) => setConfig((current) => ({ ...current, targetOwnership: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-heading font-semibold text-foreground">Follow-on trigger multiple</span>
              <input
                type="number"
                step="0.5"
                value={config.followOnThreshold}
                onChange={(event) => setConfig((current) => ({ ...current, followOnThreshold: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-heading font-semibold text-foreground">Market overlay</span>
              <select
                value={config.marketOverlay}
                onChange={(event) => setConfig((current) => ({ ...current, marketOverlay: event.target.value as MarketOverlay }))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              >
                <option value="bull">bull</option>
                <option value="base">base</option>
                <option value="bear">bear</option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-heading font-semibold text-foreground">Sector overlay</span>
              <select
                value={config.sectorOverlay}
                onChange={(event) => setConfig((current) => ({ ...current, sectorOverlay: event.target.value as SectorOverlay }))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              >
                <option value="standard">standard</option>
                <option value="ai_premium">ai premium</option>
              </select>
            </label>
            </div>
          </Card>
        ) : null}

        <Card>
          <h2 className="font-heading text-xl font-semibold">Interpretation flags</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Top winner share</p>
                <p className="mt-2 font-heading text-2xl font-semibold">{formatPercent(summary.topWinnerShareMedian)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Top three share</p>
                <p className="mt-2 font-heading text-2xl font-semibold">{formatPercent(summary.topThreeShareMedian)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Gross TVPI median</p>
                <p className="mt-2 font-heading text-2xl font-semibold">{formatMultiple(summary.grossTVPIMedian)}</p>
              </div>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {summary.warnings.map((warning) => (
              <li key={warning} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                {warning}
              </li>
            ))}
          </ul>
          {summary.netTVPIMedian < 1 ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-slate-700">
              A median net TVPI below 1x does not mean the strategy is broken. In venture, median paths can still be weak
              while expected value is carried by rare tail winners. Use the concentration metrics and J-curve together.
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
