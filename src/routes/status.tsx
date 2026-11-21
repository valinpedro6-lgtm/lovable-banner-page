import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { RecoveryChart } from "@/components/Charts";
import { Disclaimer, PageHeader, SectionTitle } from "@/components/PageHeader";
import { MiniBar } from "@/components/RecoveryRing";
import { useEngine } from "@/hooks/use-engine";
import { forecast } from "@/lib/forecast";
import { hoursLabel, relTime } from "@/lib/format";
import { MUSCLES } from "@/lib/muscles";
import { BAND_COLOR, BAND_LABEL, type RecoveryBand } from "@/lib/recovery";
import { fmtSets } from "@/lib/stats";
import { cn } from "@/lib/utils";

const DESC = "Recuperação estimada de cada grupo muscular, previsão para as próximas 72 h e volume semanal.";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Status muscular · MUSCLE RECOVERY" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Status muscular · MUSCLE RECOVERY" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StatusPage,
});

const BANDS: RecoveryBand[] = ["low", "mid", "high", "full"];
type Sort = "pct" | "ready" | "az";
const SORTS: [Sort, string][] = [
  ["pct", "Mais cansados"],
  ["ready", "Prontos antes"],
  ["az", "A–Z"],
];

function StatusPage() {
  const { states, overall, input, now } = useEngine();
  const [band, setBand] = useState<RecoveryBand | "all">("all");
  const [sort, setSort] = useState<Sort>("pct");

  const data = useMemo(() => forecast(input, now, { hours: 72, step: 3 }), [input, now]);
  const in24 = data.find((d) => d.h === 24)?.pct ?? overall;
  const in72 = data.at(-1)?.pct ?? overall;
  const counts = Object.fromEntries(BANDS.map((b) => [b, states.filter((s) => s.band === b).length])) as Record<
    RecoveryBand,
    number
  >;
  const nextReady = [...states].filter((s) => s.hoursToReady > 0).sort((a, b) => a.hoursToReady - b.hoursToReady)[0];

  const list = states
    .filter((s) => band === "all" || s.band === band)
    .sort((a, b) => {
      if (sort === "az") return MUSCLES[a.muscle].name.localeCompare(MUSCLES[b.muscle].name, "pt-BR");
      if (sort === "ready") return a.hoursToReady - b.hoursToReady || b.pct - a.pct;
      return a.pct - b.pct;
    });

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Status · ao vivo" title="Recuperação" />

      <section className="panel p-5 animate-rise">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Agora</div>
            <div className="num text-5xl font-semibold leading-none">
              {overall}
              <span className="text-xl text-muted-foreground">%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-right">
            <Projection label="Em 24h" value={in24} base={overall} />
            <Projection label="Em 72h" value={in72} base={overall} />
          </div>
        </div>
        <div className="mt-4">
          <RecoveryChart data={data} />
        </div>
        {nextReady && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>
              Próximo a ficar pronto:{" "}
              <span className="text-foreground">{MUSCLES[nextReady.muscle].name}</span> em{" "}
              <span className="num text-foreground">{hoursLabel(nextReady.hoursToReady)}</span>
            </span>
          </div>
        )}
      </section>

      <section className="grid grid-cols-4 gap-2 animate-rise">
        {BANDS.map((b) => {
          const on = band === b;
          return (
            <button
              key={b}
              onClick={() => setBand(on ? "all" : b)}
              className={cn(
                "rounded-2xl border p-3 text-left transition-all active:scale-95",
                on ? "border-primary bg-accent" : "border-border bg-surface",
              )}
            >
              <span className="block h-1.5 w-6 rounded-full" style={{ background: BAND_COLOR[b] }} />
              <span className="num mt-2 block text-2xl font-semibold">{counts[b]}</span>
              <span className="block truncate text-[10px] text-muted-foreground">{BAND_LABEL[b]}</span>
            </button>
          );
        })}
      </section>

      <section className="panel p-5 animate-rise">
        <SectionTitle
          action={
            band !== "all" && (
              <button onClick={() => setBand("all")} className="text-xs text-primary">
                Limpar filtro
              </button>
            )
          }
        >
          {band === "all" ? "Todos os músculos" : BAND_LABEL[band]}
        </SectionTitle>
        <div className="-mx-1 mb-2 flex gap-1 overflow-x-auto px-1 scrollbar-none">
          {SORTS.map(([v, l]) => (
            <button
              key={v}
              onClick={() => setSort(v)}
              className={cn(
                "h-8 shrink-0 rounded-full px-3 text-xs transition-colors",
                sort === v ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <ul className="divide-y divide-border/60">
          {list.map((s) => (
            <li key={s.muscle}>
              <Link
                to="/musculo/$id"
                params={{ id: s.muscle }}
                className="group flex items-center gap-4 py-3.5"
              >
                <div className="num w-14 shrink-0 text-2xl font-semibold" style={{ color: BAND_COLOR[s.band] }}>
                  {s.pct}
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{MUSCLES[s.muscle].name}</span>
                    <span className="num shrink-0 text-[11px] text-muted-foreground">
                      {s.hoursToReady > 0 ? `pronto em ${hoursLabel(s.hoursToReady)}` : "pronto"}
                    </span>
                  </div>
                  <MiniBar pct={s.pct} />
                  <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                    <span>{relTime(s.lastStimulus, now)}</span>
                    <span className="num">{fmtSets(s.weeklySets)} séries/sem</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
          {list.length === 0 && (
            <li className="py-8 text-center text-sm text-muted-foreground">Nenhum músculo nesta faixa agora.</li>
          )}
        </ul>
      </section>

      <Disclaimer />
    </div>
  );
}

function Projection({ label, value, base }: { label: string; value: number; base: number }) {
  const diff = value - base;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="num text-xl font-semibold">{value}%</div>
      <div className={cn("num text-[11px]", diff > 0 ? "text-primary" : "text-muted-foreground")}>
        {diff > 0 ? `+${diff}` : "±0"}
      </div>
    </div>
  );
}
