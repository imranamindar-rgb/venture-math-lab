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

export function TornadoChart({
  title,
  data,
  valueFormatter,
}: {
  title: string;
  data: Array<{
    label: string;
    lowerDelta: number;
    upperDelta: number;
  }>;
  valueFormatter: (value: number) => string;
}) {
  return (
    <div
      className="overflow-hidden rounded-panel border border-border/70 bg-white p-4"
      role="img"
      aria-label={`${title} tornado sensitivity chart`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">{title}</h3>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Sensitivity</p>
      </div>
      <div className="h-[320px] w-full md:h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid horizontal={false} strokeDasharray="4 4" stroke="#e5e7eb" />
            <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => valueFormatter(Number(value))} />
            <YAxis type="category" dataKey="label" width={120} tickLine={false} axisLine={false} fontSize={12} />
            <Tooltip formatter={(value: number) => valueFormatter(value)} />
            <Bar dataKey="lowerDelta" fill="#c2410c" radius={[10, 0, 0, 10]} />
            <Bar dataKey="upperDelta" fill="#2563eb" radius={[0, 10, 10, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
