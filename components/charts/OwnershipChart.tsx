"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { OwnershipPoint } from "@/lib/sim/types";

export function OwnershipChart({ data }: { data: OwnershipPoint[] }) {
  return (
    <div className="h-80 rounded-panel border border-border/70 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">Ownership Drift by Stage</h3>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Fully diluted</p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e5e7eb" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
          <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
          <Line type="monotone" dataKey="founderPct" stroke="#7c2d12" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="employeePct" stroke="#2563eb" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="investorPct" stroke="#059669" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="poolPct" stroke="#d97706" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
