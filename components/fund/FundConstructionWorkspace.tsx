"use client";

import { useMemo, useState } from "react";

import { stageOrder, FundingStage, MarketOverlay, SectorOverlay } from "@/lib/sim/types";
import { Card } from "@/components/ui/Card";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { HistogramChart } from "@/components/charts/HistogramChart";
import { ProbabilityChart } from "@/components/charts/ProbabilityChart";
import {
  getDefaultFundConstructionConfig,
  sanitizeFundConstructionConfig,
  summarizeFundConstruction,
} from "@/lib/engines/fund-construction";
import { formatCurrency, formatMultiple, formatPercent } from "@/lib/format";

export function FundConstructionWorkspace() {
  const [config, setConfig] = useState(getDefaultFundConstructionConfig());
  const safeConfig = useMemo(() => sanitizeFundConstructionConfig(config), [config]);
  const summary = useMemo(() => summarizeFundConstruction(safeConfig), [safeConfig]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 2xl:grid-cols-[0.95fr,1.35fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Fund construction lab</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold">Whole-fund venture math</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Model fee drag, reserve strategy, portfolio size, concentration, and one-company-return-the-fund odds at the fund level.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <label className="space-y-2 text-sm">
              <span className="font-heading font-semibold text-foreground">Fund size</span>
              <MoneyInput
                value={config.fundSize}
                onValueChange={(value) => setConfig((current) => ({ ...current, fundSize: value }))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-heading font-semibold text-foreground">Stage focus</span>
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
              <span className="font-heading font-semibold text-foreground">Initial check size</span>
              <MoneyInput
                value={config.initialCheckSize}
                onValueChange={(value) => setConfig((current) => ({ ...current, initialCheckSize: value }))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-heading font-semibold text-foreground">Follow-on check size</span>
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

        <div className="space-y-6">
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

          <div className="grid gap-4 2xl:grid-cols-[1.05fr,0.95fr]">
            <HistogramChart title="Net TVPI Distribution" data={summary.netMultipleHistogram} />
            <ProbabilityChart title="Fund Concentration and Outcomes" data={summary.concentrationMetrics} />
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
          </Card>
        </div>
      </div>
    </div>
  );
}
