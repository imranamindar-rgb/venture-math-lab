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

export function TermSheetComparatorChart({
  title,
  data,
  baselineKey,
  comparisonKey,
  baselineLabel,
  comparisonLabel,
  formatter,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  baselineKey: string;
  comparisonKey: string;
  baselineLabel: string;
  comparisonLabel: string;
  formatter: (value: number) => string;
}) {
  return (
    <div className="overflow-hidden rounded-panel border border-border/70 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">{title}</h3>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Term sheet A/B</p>
      </div>
      <div className="h-[280px] w-full md:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 14 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e5e7eb" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} height={40} tickMargin={10} />
            <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(value) => formatter(Number(value))} />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatter(value),
                name === baselineKey ? baselineLabel : comparisonLabel,
              ]}
            />
            <Line type="monotone" dataKey={baselineKey} stroke="#7c2d12" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey={comparisonKey} stroke="#2563eb" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
