"use client";

import { useMemo } from "react";

import { useScenarioStore } from "@/lib/state/scenario-store";
import { runSensitivityAnalysis, SensitivitySummary } from "@/lib/engines/sensitivity";
import { TornadoChart } from "@/components/charts/TornadoChart";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";

function formatParamValue(unit: string, value: number): string {
  switch (unit) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return `${(value * 100).toFixed(1)}%`;
    case "multiple":
      return `${value.toFixed(2)}x`;
    case "count":
      return value.toLocaleString("en-US");
    default:
      return value.toFixed(2);
  }
}

export function SensitivityWorkspace() {
  const active = useScenarioStore((state) => state.active);

  const analysis: SensitivitySummary = useMemo(() => {
    return runSensitivityAnalysis(active);
  }, [active]);

  const chartData = analysis.results.map((r) => ({
    label: r.parameter.label,
    lowerDelta: r.lowerDelta,
    upperDelta: r.upperDelta,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Hero card */}
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                One-at-a-time analysis
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold">
                Parameter Sensitivity
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Each input parameter is varied independently while all others are held at their
                base values. The chart below shows how much the founder median outcome shifts
                when each parameter moves to its lower and upper bound.
              </p>
            </div>
            <div className="rounded-full border border-border bg-slate-50 px-4 py-2 text-sm text-slate-600">
              Base median {formatCurrency(analysis.baselineMedian)}
            </div>
          </div>
        </Card>

        {/* Tornado chart */}
        {chartData.length > 0 && (
          <TornadoChart
            title="Impact on Founder Median Proceeds"
            data={chartData}
            valueFormatter={(v) => formatCurrency(v)}
          />
        )}

        {/* Detail table */}
        <Card>
          <h3 className="mb-4 font-heading text-lg font-semibold">Parameter Detail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Parameter</th>
                  <th className="pb-3 pr-4 font-medium">Base Value</th>
                  <th className="pb-3 pr-4 font-medium">Lower Value</th>
                  <th className="pb-3 pr-4 font-medium">Upper Value</th>
                  <th className="pb-3 pr-4 font-medium">Lower Impact</th>
                  <th className="pb-3 font-medium">Upper Impact</th>
                </tr>
              </thead>
              <tbody>
                {analysis.results.map((r) => (
                  <tr key={r.parameter.id} className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {r.parameter.label}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatParamValue(r.parameter.unit, r.parameter.baseValue)}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatParamValue(r.parameter.unit, r.parameter.lowerValue)}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatParamValue(r.parameter.unit, r.parameter.upperValue)}
                    </td>
                    <td
                      className={`py-3 pr-4 font-medium ${
                        r.lowerDelta < 0 ? "text-red-700" : "text-blue-700"
                      }`}
                    >
                      {r.lowerDelta >= 0 ? "+" : ""}
                      {formatCurrency(r.lowerDelta)}
                    </td>
                    <td
                      className={`py-3 font-medium ${
                        r.upperDelta < 0 ? "text-red-700" : "text-blue-700"
                      }`}
                    >
                      {r.upperDelta >= 0 ? "+" : ""}
                      {formatCurrency(r.upperDelta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Methodology note */}
        <Card>
          <p className="text-xs leading-5 text-slate-500">
            Parameters are varied one-at-a-time (OAT) around their base values. Each sensitivity
            run uses a reduced Monte Carlo simulation ({analysis.iterations.toLocaleString()} iterations)
            for speed. Interaction effects between parameters are not captured by this
            method &mdash; for correlated parameter shifts, use the full Monte Carlo simulator
            with custom scenario presets.
          </p>
        </Card>
      </div>
    </div>
  );
}
