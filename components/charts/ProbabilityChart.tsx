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

import { ThresholdMetric } from "@/lib/sim/types";

export function ProbabilityChart({
  title,
  data,
}: {
  title: string;
  data: ThresholdMetric[];
}) {
  return (
    <div className="overflow-hidden rounded-panel border border-border/70 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">{title}</h3>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Risk layers</p>
      </div>
      <div className="h-[250px] w-full md:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid horizontal={false} strokeDasharray="4 4" stroke="#e5e7eb" />
          <XAxis type="number" tickFormatter={(value) => `${Math.round(value * 100)}%`} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="label" width={140} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
          <Bar dataKey="probability" fill="#0f766e" radius={[0, 10, 10, 0]} />
        </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
