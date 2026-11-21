import { cn } from "@/lib/utils";

export function ViewToggle({
  value,
  onChange,
}: {
  value: "front" | "back";
  onChange: (v: "front" | "back") => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-surface p-1 text-xs font-medium">
      {(
        [
          ["front", "Frente"],
          ["back", "Costas"],
        ] as const
      ).map(([v, l]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "rounded-full px-4 py-1.5 transition-colors",
            value === v ? "bg-secondary text-foreground" : "text-muted-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function RecoveryLegend() {
  const items = [
    ["var(--rec-low)", "0–39"],
    ["var(--rec-mid)", "40–69"],
    ["var(--rec-high)", "70–89"],
    ["var(--rec-full)", "90–100"],
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
      {items.map(([c, l]) => (
        <span key={l} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: c }} />
          <span className="num">{l}%</span>
        </span>
      ))}
    </div>
  );
}
