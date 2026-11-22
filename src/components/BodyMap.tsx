import type { MuscleId } from "@/lib/muscles";
import { cn } from "@/lib/utils";

type Shape = { m: MuscleId; d: string } | { m: MuscleId; rect: [number, number, number, number] };

// Left half of the figure (x ≤ 100). Each shape is drawn twice: as-is and mirrored.
const FRONT: Shape[] = [
  { m: "trapezio", d: "M91 54 Q82 60 72 64 Q82 66 90 66 Z" },
  { m: "deltoides", d: "M71 64 Q57 64 51 78 Q48 90 52 100 Q60 94 66 86 Q72 76 75 68 Z" },
  { m: "peitoral", d: "M76 68 Q88 65 99 68 L99 98 Q88 104 77 100 Q67 96 65 88 Q68 76 76 68 Z" },
  { m: "biceps", d: "M53 102 Q59 96 65 91 Q69 104 67 120 Q63 133 57 137 Q49 131 49 118 Q49 108 53 102 Z" },
  { m: "antebracos", d: "M49 139 Q56 138 61 141 Q61 160 55 182 L45 182 Q41 162 49 139 Z" },
  { m: "abdomen", rect: [89, 104, 9.5, 14.5] },
  { m: "abdomen", rect: [89, 121, 9.5, 14.5] },
  { m: "abdomen", rect: [89, 138, 9.5, 14.5] },
  { m: "abdomen", d: "M89 155 L98.5 155 L98.5 178 Q92 172 89 162 Z" },
  { m: "abdomen", d: "M77 104 Q84 106 87 110 L87 160 Q81 158 77 150 Q73 128 77 104 Z" },
  { m: "quadriceps", d: "M73 166 Q86 178 98 190 Q98 228 93 258 Q85 266 77 262 Q67 238 67 208 Q67 184 73 166 Z" },
  { m: "panturrilhas", d: "M75 280 Q81 276 90 280 Q94 308 90 338 Q84 350 79 344 Q71 318 75 280 Z" },
];

const BACK: Shape[] = [
  { m: "dorsais", d: "M71 84 Q80 88 87 98 Q94 112 99.5 126 L99.5 140 Q87 146 79 140 Q71 120 65 96 Q66 88 71 84 Z" },
  { m: "trapezio", d: "M91 50 Q96 48 99.5 48 L99.5 122 Q93 110 87 94 Q79 78 68 68 Q82 60 91 50 Z" },
  { m: "deltoides", d: "M68 66 Q56 66 50 80 Q48 92 52 100 Q62 92 70 82 Q73 74 68 66 Z" },
  { m: "lombar", d: "M80 143 Q90 149 99.5 145 L99.5 172 Q88 170 80 166 Q78 154 80 143 Z" },
  { m: "triceps", d: "M53 102 Q59 96 66 91 Q70 104 67 120 Q63 133 57 137 Q49 131 49 118 Q49 108 53 102 Z" },
  { m: "antebracos", d: "M49 139 Q56 138 61 141 Q61 160 55 182 L45 182 Q41 162 49 139 Z" },
  { m: "gluteos", d: "M77 168 Q90 173 99.5 177 L99.5 210 Q88 216 78 210 Q68 198 70 183 Q72 172 77 168 Z" },
  { m: "posteriores", d: "M70 214 Q84 222 97 216 Q98 240 93 262 Q85 268 77 264 Q66 240 70 214 Z" },
  { m: "panturrilhas", d: "M74 280 Q84 274 92 282 Q96 304 90 330 Q84 344 78 340 Q68 316 74 280 Z" },
];

const NEUTRAL_HALF = [
  "M44 184 Q40 194 43 204 Q48 208 52 202 Q55 192 54 184 Z", // hand
  "M77 266 Q84 272 92 264 Q93 274 90 280 Q82 276 75 280 Q75 272 77 266 Z", // knee
  "M78 344 Q84 352 90 340 Q92 352 91 358 Q93 366 86 368 L78 368 Q74 362 78 352 Z", // ankle/foot
];

const DETAIL_FRONT = ["M80 196 Q84 228 86 258", "M94 232 Q89 246 86 258", "M57 108 Q58 120 57 132"];
const DETAIL_BACK = ["M84 222 Q85 240 85 262", "M58 104 Q57 116 59 128", "M88 180 Q86 196 84 210"];

export interface BodyMapProps {
  view: "front" | "back";
  fills: Partial<Record<MuscleId, string>>;
  /** Muscles drawn at full opacity with a silver outline (selection mode). */
  highlighted?: MuscleId[];
  dimUnfilled?: boolean;
  onSelect?: (m: MuscleId) => void;
  className?: string;
}

const MIRROR = "matrix(-1 0 0 1 200 0)";

export function BodyMap({ view, fills, highlighted, onSelect, className }: BodyMapProps) {
  const shapes = view === "front" ? FRONT : BACK;
  const details = view === "front" ? DETAIL_FRONT : DETAIL_BACK;
  const hl = new Set(highlighted ?? []);

  const renderShape = (s: Shape, key: string, mirror: boolean) => {
    const fill = fills[s.m];
    const active = hl.has(s.m);
    const common = {
      className: "muscle",
      fill: fill ?? "var(--body)",
      fillOpacity: fill ? 0.92 : 1,
      stroke: active ? "var(--primary)" : "var(--body-line)",
      strokeWidth: active ? 1.4 : 1.1,
      strokeLinejoin: "round" as const,
      transform: mirror ? MIRROR : undefined,
      onClick: onSelect ? () => onSelect(s.m) : undefined,
      "data-muscle": s.m,
    };
    if ("rect" in s) {
      const [x, y, w, h] = s.rect;
      return <rect key={key} x={x} y={y} width={w} height={h} rx={3} {...common} />;
    }
    return <path key={key} d={s.d} {...common} />;
  };

  return (
    <svg
      viewBox="20 6 160 368"
      className={cn("h-full w-full select-none", className)}
      role="img"
      aria-label={view === "front" ? "Mapa muscular frontal" : "Mapa muscular posterior"}
    >
      <defs>
        <radialGradient id="floor" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="368" rx="46" ry="6" fill="url(#floor)" />
      {/* head + neck */}
      <ellipse cx="100" cy="28" rx="14.5" ry="18" fill="var(--body)" stroke="var(--body-line)" />
      <path d="M92 42 Q100 47 108 42 L110 58 Q100 63 90 58 Z" fill="var(--body)" stroke="var(--body-line)" />
      {NEUTRAL_HALF.map((d, i) => (
        <g key={i}>
          <path d={d} fill="var(--body)" stroke="var(--body-line)" />
          <path d={d} fill="var(--body)" stroke="var(--body-line)" transform={MIRROR} />
        </g>
      ))}
      {shapes.map((s, i) => renderShape(s, `l${i}`, false))}
      {shapes.map((s, i) => renderShape(s, `r${i}`, true))}
      <g stroke="var(--body-line)" strokeOpacity="0.55" fill="none" strokeWidth="0.8" pointerEvents="none">
        {details.map((d, i) => (
          <g key={i}>
            <path d={d} />
            <path d={d} transform={MIRROR} />
          </g>
        ))}
      </g>
    </svg>
  );
}
