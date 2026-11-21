import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ForecastPoint } from "@/lib/forecast";

const tick = { fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" };

function Tip({
  active,
  payload,
  label,
  suffix = "",
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  suffix?: string;
}) {
  const v = payload?.[0]?.value;
  if (!active || v === undefined) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <div className="text-muted-foreground">{label}</div>
      <div className="num text-sm font-semibold text-foreground">
        {v}
        {suffix}
      </div>
    </div>
  );
}

export function RecoveryChart({ data, height = 160 }: { data: ForecastPoint[]; height?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <div style={{ height }} className="-mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} tick={tick} />
          <YAxis domain={[0, 100]} ticks={[0, 50, 90]} tickLine={false} axisLine={false} tick={tick} />
          <ReferenceLine y={90} stroke="var(--rec-full)" strokeDasharray="4 4" strokeOpacity={0.45} />
          <Tooltip cursor={{ stroke: "var(--border)" }} content={<Tip suffix="%" />} />
          <Area
            type="monotone"
            dataKey="pct"
            stroke="var(--primary)"
            strokeWidth={2}
            fill={`url(#g${id})`}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyBars({
  data,
  height = 150,
}: {
  data: { label: string; value: number; current?: boolean }[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="-mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} />
          <YAxis tickLine={false} axisLine={false} tick={tick} allowDecimals={false} />
          <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<Tip suffix=" séries" />} />
          <Bar dataKey="value" radius={[6, 6, 6, 6]} maxBarSize={26} animationDuration={800}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.current ? "var(--primary)" : "var(--surface-2)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendLine({
  data,
  height = 120,
  suffix = "",
}: {
  data: { label: string; value: number }[];
  height?: number;
  suffix?: string;
}) {
  return (
    <div style={{ height }} className="-mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} tick={tick} />
          <YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} tick={tick} />
          <Tooltip cursor={{ stroke: "var(--border)" }} content={<Tip suffix={suffix} />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
