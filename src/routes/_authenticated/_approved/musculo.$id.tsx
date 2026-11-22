import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, HeartPulse } from "lucide-react";
import { useMemo } from "react";
import { BodyMap } from "@/components/BodyMap";
import { RecoveryChart } from "@/components/Charts";
import { CheckInSheet } from "@/components/CheckInSheet";
import { Disclaimer, PageHeader, SectionTitle } from "@/components/PageHeader";
import { RecoveryRing } from "@/components/RecoveryRing";
import { Button } from "@/components/ui/button";
import { useAllExercises, useEngine } from "@/hooks/use-engine";
import { forecast } from "@/lib/forecast";
import { dateLabel, hoursLabel, relTime } from "@/lib/format";
import { isMuscleId, MUSCLES, type MuscleId } from "@/lib/muscles";
import { BAND_COLOR, BAND_LABEL } from "@/lib/recovery";
import { exerciseUsage, fmtSets, cap } from "@/lib/stats";
import { exerciseName } from "@/lib/workout-utils";

export const Route = createFileRoute("/_authenticated/_approved/musculo/$id")({
  beforeLoad: ({ params }) => {
    if (!isMuscleId(params.id)) throw notFound();
  },
  head: ({ params }) => {
    const name = isMuscleId(params.id) ? MUSCLES[params.id].name : "Músculo";
    const desc = `Recuperação estimada, previsão e histórico de treino de ${name}.`;
    return {
      meta: [
        { title: `${name} · MUSCLE RECOVERY` },
        { name: "description", content: desc },
        { property: "og:title", content: `${name} · MUSCLE RECOVERY` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: MusclePage,
});

function MusclePage() {
  const { id } = Route.useParams();
  const m: MuscleId = isMuscleId(id) ? id : "peitoral";
  const { states, input, now, workouts, app } = useEngine();
  const all = useAllExercises();
  const navigate = useNavigate();
  const info = MUSCLES[m];
  const s = states.find((x) => x.muscle === m);

  const data = useMemo(() => forecast(input, now, { hours: 96, step: 4, muscle: m }), [input, now, m]);
  const sessions = workouts
    .filter((w) => new Date(w.date).getTime() <= now)
    .filter((w) => w.entries.some((e) => e.muscle === m || e.secondary.includes(m)))
    .slice(0, 5);
  const usage = useMemo(() => exerciseUsage(app.workouts), [app.workouts]);
  const top = all
    .filter((e) => e.muscle === m)
    .sort((a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0) || a.name.localeCompare(b.name, "pt-BR"))
    .slice(0, 6);

  if (!s) return null;
  const color = BAND_COLOR[s.band];

  return (
    <div className="space-y-5">
      <Link
        to="/status"
        className="inline-flex items-center gap-1.5 pt-5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Status
      </Link>
      <div className="-mt-5">
        <PageHeader eyebrow={BAND_LABEL[s.band]} title={info.name} />
      </div>

      <section className="panel relative overflow-hidden p-5 animate-rise">
        <div
          className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full opacity-20 blur-3xl"
          style={{ background: color }}
        />
        <div className="flex items-center gap-5">
          <RecoveryRing pct={s.pct} size={140} stroke={10} label="Recuperação" />
          <div className="grid flex-1 grid-cols-1 gap-3">
            <Fact label="Pronto em" value={hoursLabel(s.hoursToReady)} />
            <Fact label="Último estímulo" value={relTime(s.lastStimulus, now)} />
            <Fact
              label="Ritmo atual"
              value={s.ratePerHour > 0 ? `+${s.ratePerHour}%/h` : s.pct >= 100 ? "Completo" : "Estável"}
            />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-surface px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Séries / 7 dias</div>
            <div className="num text-lg font-semibold">{fmtSets(s.weeklySets)}</div>
          </div>
          <div className="rounded-xl bg-surface px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Dor relatada</div>
            <div className="text-lg font-semibold">{["Nenhuma", "Leve", "Moderada", "Forte"][s.soreness]}</div>
          </div>
        </div>
      </section>

      <section className="panel p-5 animate-rise">
        <SectionTitle>Previsão · 4 dias</SectionTitle>
        <RecoveryChart data={data} height={170} />
        <p className="mt-2 text-xs text-muted-foreground">
          Linha tracejada = 90 %, pronto para treinar pesado. Considera que você não treine este músculo até lá.
        </p>
      </section>

      <section className="grid grid-cols-[1fr_1.2fr] gap-3 animate-rise">
        <div className="panel grid place-items-center p-3">
          <div className="h-[220px] w-full">
            <BodyMap
              view={info.side === "back" ? "back" : "front"}
              fills={{ [m]: color }}
              highlighted={[m]}
              onSelect={(o) => navigate({ to: "/musculo/$id", params: { id: o } })}
            />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <CheckInSheet focus={m}>
            <button className="panel flex flex-1 flex-col justify-between p-4 text-left transition-colors hover:border-primary">
              <HeartPulse className="h-5 w-5 text-primary" />
              <span>
                <span className="block text-sm font-medium">Sentindo dor?</span>
                <span className="block text-xs text-muted-foreground">Ajuste a estimativa</span>
              </span>
            </button>
          </CheckInSheet>
          <Button asChild variant="lime" size="pill" className="w-full">
            <Link to="/registrar">Registrar treino</Link>
          </Button>
        </div>
      </section>

      <section className="panel p-5 animate-rise">
        <SectionTitle>Últimas sessões</SectionTitle>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum treino registrado para este músculo ainda.</p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((w) => {
              const hits = w.entries.filter((e) => e.muscle === m || e.secondary.includes(m));
              return (
                <li key={w.id} className="rounded-2xl border border-border/70 bg-surface p-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium">{cap(dateLabel(w.date))}</span>
                    <span className="text-muted-foreground">{relTime(new Date(w.date).getTime(), now)}</span>
                  </div>
                  <ul className="space-y-1">
                    {hits.map((e) => (
                      <li key={e.id} className="flex justify-between gap-2 text-xs text-muted-foreground">
                        <span className="truncate">
                          {exerciseName(e.exerciseId, app.customExercises)}
                          {e.muscle !== m && <span className="ml-1 text-[10px] opacity-70">(secundário)</span>}
                        </span>
                        <span className="num shrink-0 text-foreground">
                          {e.sets}×{e.reps}
                          {e.load > 0 && ` · ${e.load}kg`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel p-5 animate-rise">
        <SectionTitle
          action={
            <Link to="/exercicios" search={{ m }} className="flex items-center gap-1 text-xs text-primary">
              Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          Exercícios para {info.short.toLowerCase()}
        </SectionTitle>
        <ul className="grid grid-cols-2 gap-2">
          {top.map((e) => (
            <li key={e.id} className="rounded-xl border border-border/70 bg-surface p-3">
              <div className="line-clamp-2 text-xs font-medium leading-snug">{e.name}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {e.equipment}
                {(usage.get(e.id) ?? 0) > 0 && <span className="text-primary"> · {usage.get(e.id)}× feito</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Disclaimer />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="num text-base font-semibold">{value}</div>
    </div>
  );
}
