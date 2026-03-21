"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { HistogramBucket } from "@/lib/sim/types";

export function HistogramChart({
  title,
  data,
}: {
  title: string;
  data: HistogramBucket[];
}) {
  return (
    <div
      className="overflow-hidden rounded-panel border border-border/70 bg-white p-4"
      role="img"
      aria-label={`${title} histogram chart`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">{title}</h3>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Probability</p>
      </div>
      <div className="h-[250px] w-full md:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 14 }}>
          <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e5e7eb" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} interval={0} height={44} tickMargin={10} />
          <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
          <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
          <Bar dataKey="value" fill="#c2410c" radius={[10, 10, 0, 0]} />
        </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
