"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function FundTimelineChart({
  data,
  benchmark,
}: {
  data: Array<{
    year: number;
    dpiMedian: number;
    tvpiMedian: number;
    paidInRatioMedian: number;
  }>;
  benchmark?: {
    label: string;
    timeline: Array<{
      year: number;
      dpi: number;
      tvpi: number;
    }>;
  };
}) {
  const mergedData = data.map((point) => {
    const benchmarkPoint = benchmark?.timeline.find((entry) => entry.year === point.year);
    return {
      ...point,
      benchmarkDpi: benchmarkPoint?.dpi,
      benchmarkTvpi: benchmarkPoint?.tvpi,
    };
  });

  return (
    <div
      className="overflow-hidden rounded-panel border border-border/70 bg-white p-4"
      role="img"
      aria-label={`J-curve timeline chart${benchmark ? ` with ${benchmark.label} benchmark overlay` : ""}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">J-Curve Timeline</h3>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
          {benchmark ? `${benchmark.label} overlay` : "Median path"}
        </p>
      </div>
      <div className="h-[280px] w-full md:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mergedData} margin={{ top: 8, right: 8, left: 0, bottom: 14 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e5e7eb" />
            <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} height={40} tickMargin={10} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={46}
              tickFormatter={(value) => `${value.toFixed(1)}x`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                name === "paidInRatioMedian" ? `${(value * 100).toFixed(0)}%` : `${value.toFixed(2)}x`,
                name === "dpiMedian"
                  ? "DPI"
                  : name === "tvpiMedian"
                    ? "TVPI"
                    : name === "benchmarkDpi"
                      ? "Benchmark DPI"
                      : name === "benchmarkTvpi"
                        ? "Benchmark TVPI"
                        : "Paid-in % of fund",
              ]}
            />
            <Line type="monotone" dataKey="dpiMedian" stroke="#2563eb" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="tvpiMedian" stroke="#7c2d12" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="paidInRatioMedian" stroke="#059669" strokeWidth={2} dot={false} />
            {benchmark ? (
              <>
                <Line
                  type="monotone"
                  dataKey="benchmarkDpi"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="6 4"
                />
                <Line
                  type="monotone"
                  dataKey="benchmarkTvpi"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="6 4"
                />
              </>
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
