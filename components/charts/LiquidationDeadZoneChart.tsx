"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/format";

export function LiquidationDeadZoneChart({
  data,
  deadZoneEndsAt,
}: {
  data: Array<{
    exitValue: number;
    founderNet: number;
    investorProceeds: number;
    preferenceBurden: number;
  }>;
  deadZoneEndsAt: number;
}) {
  return (
    <div className="overflow-hidden rounded-panel border border-border/70 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">Liquidation Dead-Zone</h3>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Founder vs preference overhang</p>
      </div>
      <div className="h-[280px] w-full md:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 14 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e5e7eb" />
            <ReferenceArea x1={0} x2={deadZoneEndsAt} fill="#fef3c7" fillOpacity={0.35} />
            <XAxis
              dataKey="exitValue"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickFormatter={(value) => formatCompactNumber(Number(value))}
            />
            <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(value) => formatCompactNumber(Number(value))} />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "preferenceBurden") {
                  return [formatPercent(value), "Preference burden"];
                }
                return [formatCurrency(value), name === "founderNet" ? "Founder net" : "Investor proceeds"];
              }}
              labelFormatter={(value) => `Exit ${formatCurrency(Number(value))}`}
            />
            <Line type="monotone" dataKey="founderNet" stroke="#7c2d12" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="investorProceeds" stroke="#0f766e" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        The shaded region marks exits where the preferred stack still dominates the payout. Once the curve clears{" "}
        {formatCurrency(deadZoneEndsAt)}, common holders begin to participate more meaningfully.
      </p>
    </div>
  );
}
