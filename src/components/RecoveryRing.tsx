import { BAND_COLOR, bandFor } from "@/lib/recovery";
import { cn } from "@/lib/utils";

export function RecoveryRing({
  pct,
  size = 168,
  stroke = 12,
  label,
  className,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = BAND_COLOR[bandFor(pct)];
  const ticks = Array.from({ length: 48 });
  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {ticks.map((_, i) => {
          const a = (i / ticks.length) * Math.PI * 2;
          const r1 = r - stroke - 4;
          const r2 = r1 - (i % 4 === 0 ? 6 : 3);
          return (
            <line
              key={i}
              x1={size / 2 + Math.cos(a) * r1}
              y1={size / 2 + Math.sin(a) * r1}
              x2={size / 2 + Math.cos(a) * r2}
              y2={size / 2 + Math.sin(a) * r2}
              stroke="var(--border)"
              strokeWidth={1}
            />
          );
        })}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.2,0.8,0.2,1), stroke 0.6s",
            filter: `drop-shadow(0 0 8px color-mix(in oklab, ${color} 55%, transparent))`,
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="num text-5xl font-semibold leading-none" style={{ fontSize: size * 0.26 }}>
            {pct}
            <span className="text-muted-foreground" style={{ fontSize: size * 0.12 }}>
              %
            </span>
          </div>
          {label && (
            <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MiniBar({ pct }: { pct: number }) {
  const color = BAND_COLOR[bandFor(pct)];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, background: color, transition: "width 1s cubic-bezier(0.2,0.8,0.2,1)" }}
      />
    </div>
  );
}
