import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, Flame, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { WeeklyBars } from "@/components/Charts";
import { PageHeader, SectionTitle } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useEngine } from "@/hooks/use-engine";
import { dateLabel, timeLabel } from "@/lib/format";
import { MUSCLES, MUSCLE_IDS } from "@/lib/muscles";
import { sampleWorkouts } from "@/lib/sample";
import {
  addDays,
  cap,
  dayStart,
  fmtSets,
  fmtVolume,
  muscleSets,
  setsByDay,
  weekStart,
  weeklyBuckets,
  weekStreak,
} from "@/lib/stats";
import { actions } from "@/lib/store";
import type { Workout } from "@/lib/types";
import { cn } from "@/lib/utils";
import { exerciseName, workoutSets, workoutTitle, workoutVolume } from "@/lib/workout-utils";

const DESC = "Seus treinos, volume semanal, constância e distribuição de séries por músculo.";

export const Route = createFileRoute("/_authenticated/_approved/historico")({
  head: () => ({
    meta: [
      { title: "Histórico · MUSCLE RECOVERY" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Histórico · MUSCLE RECOVERY" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

const DAY = 86_400_000;
const WEEKS = 12;

function HistoryPage() {
  const { workouts, now, app } = useEngine();
  const done = useMemo(() => workouts.filter((w) => new Date(w.date).getTime() <= now), [workouts, now]);

  const since30 = now - 30 * DAY;
  const last30 = done.filter((w) => new Date(w.date).getTime() >= since30);
  const sets30 = last30.reduce((a, w) => a + workoutSets(w), 0);
  const vol30 = last30.reduce((a, w) => a + workoutVolume(w), 0);
  const streak = weekStreak(done, now);

  const weeks = useMemo(() => weeklyBuckets(done, now, 8), [done, now]);
  const byDay = useMemo(() => setsByDay(done, now), [done, now]);
  const dist = useMemo(() => {
    const ms = muscleSets(done, since30, now);
    return MUSCLE_IDS.map((m) => ({ m, v: ms[m] ?? 0 }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v);
  }, [done, since30, now]);
  const maxDist = dist[0]?.v ?? 1;

  const groups = useMemo(() => {
    const out: { label: string; items: Workout[] }[] = [];
    for (const w of done) {
      const label = new Date(w.date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      const g = out.at(-1);
      if (g && g.label === label) g.items.push(w);
      else out.push({ label, items: [w] });
    }
    return out;
  }, [done]);

  if (done.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Seus treinos" title="Histórico" />
        <div className="panel p-8 text-center animate-rise">
          <Flame className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-3 font-display text-lg font-semibold">Nada por aqui ainda</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre seu primeiro treino para ver gráficos de volume, constância e recordes.
          </p>
          <div className="mt-5 flex gap-2">
            <Button asChild variant="lime" size="pill" className="flex-1">
              <Link to="/registrar">Registrar treino</Link>
            </Button>
            <Button
              variant="chip"
              size="pill"
              className="flex-1"
              onClick={() => actions.replaceAll({ ...app, workouts: sampleWorkouts() })}
            >
              Ver exemplo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const gridStart = addDays(weekStart(now), -7 * (WEEKS - 1));
  const today = dayStart(now);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Últimos 30 dias" title="Histórico" />

      <section className="grid grid-cols-2 gap-3 animate-rise">
        <Kpi label="Treinos" value={String(last30.length)} />
        <Kpi label="Séries" value={String(sets30)} />
        <Kpi label="Volume" value={vol30 > 0 ? fmtVolume(vol30) : "—"} />
        <Kpi
          label="Sequência"
          value={`${streak} sem`}
          accent={streak >= 2}
          icon={<Flame className="h-4 w-4" />}
        />
      </section>

      <section className="panel p-5 animate-rise">
        <SectionTitle>Séries por semana</SectionTitle>
        <WeeklyBars data={weeks.map((w) => ({ label: w.label, value: w.sets, current: w.current }))} />
      </section>

      <section className="panel p-5 animate-rise">
        <SectionTitle>Constância · {WEEKS} semanas</SectionTitle>
        <div className="flex gap-2">
          <div className="grid grid-rows-7 gap-1 pt-0 text-[9px] leading-none text-muted-foreground">
            {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
              <span key={i} className="flex h-full items-center">
                {i % 2 === 0 ? d : ""}
              </span>
            ))}
          </div>
          <div className="grid flex-1 grid-flow-col grid-rows-7 gap-1">
            {Array.from({ length: WEEKS * 7 }, (_, i) => {
              const day = addDays(gridStart, i);
              const sets = byDay.get(day) ?? 0;
              const future = day > today;
              const pct = Math.min(100, 25 + sets * 4);
              return (
                <div
                  key={i}
                  title={`${new Date(day).toLocaleDateString("pt-BR")} · ${sets} séries`}
                  className={cn(
                    "aspect-square rounded-[4px]",
                    future ? "opacity-0" : sets === 0 && "bg-surface-2",
                    day === today && "ring-1 ring-primary",
                  )}
                  style={
                    sets > 0
                      ? { background: `color-mix(in oklab, var(--primary) ${pct}%, var(--surface-2))` }
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      </section>

      {dist.length > 0 && (
        <section className="panel p-5 animate-rise">
          <SectionTitle>Séries por músculo · 30 dias</SectionTitle>
          <ul className="space-y-2.5">
            {dist.map(({ m, v }) => (
              <li key={m}>
                <Link to="/musculo/$id" params={{ id: m }} className="block">
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{MUSCLES[m].name}</span>
                    <span className="num text-muted-foreground">{fmtSets(v)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-lime-gradient"
                      style={{ width: `${(v / maxDist) * 100}%`, transition: "width 1s" }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {groups.map((g) => (
        <section key={g.label} className="animate-rise">
          <SectionTitle>{g.label}</SectionTitle>
          <ul className="space-y-2">
            {g.items.map((w) => (
              <WorkoutItem key={w.id} w={w} custom={app.customExercises} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className={cn("panel p-4", accent && "border-primary/60")}>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
        {icon && <span className={accent ? "text-primary" : ""}>{icon}</span>}
      </div>
      <div className="num mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function WorkoutItem({ w, custom }: { w: Workout; custom: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const remove = () => {
    actions.deleteWorkout(w.id);
    toast("Treino removido", {
      action: { label: "Desfazer", onClick: () => actions.addWorkout(w) },
    });
  };
  const vol = workoutVolume(w);
  return (
    <li className="panel overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 p-4 text-left">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface text-center">
          <div>
            <div className="num text-sm font-semibold leading-none">{new Date(w.date).getDate()}</div>
            <div className="text-[9px] uppercase text-muted-foreground">
              {new Date(w.date).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{workoutTitle(w)}</div>
          <div className="text-xs text-muted-foreground">
            {timeLabel(w.date)} ·{" "}
            {w.cardio
              ? `${Math.round(w.cardio.durationSeconds / 60)} min cardio`
              : `${w.entries.length} ${w.kind === "quick" ? "grupos" : "exercícios"} · ${workoutSets(w)} séries`}
            {vol > 0 && ` · ${fmtVolume(vol)}`}
          </div>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-border/60 px-4 pt-2 pb-4">
          <div className="mb-2 text-[11px] text-muted-foreground">{cap(dateLabel(w.date))}</div>
          <ul className="space-y-2">
            {w.entries.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate">
                    {e.exerciseId ? exerciseName(e.exerciseId, custom) : MUSCLES[e.muscle].name}
                  </div>
                  <div className="text-[11px] text-primary">{MUSCLES[e.muscle].short}</div>
                </div>
                <div className="num shrink-0 text-right text-xs">
                  {e.sets}×{e.reps}
                  {e.load > 0 && ` · ${e.load}kg`}
                  <div className="text-muted-foreground">RPE {e.rpe}</div>
                </div>
              </li>
            ))}
          </ul>
          <Button variant="ghost" size="sm" className="mt-3 w-full text-destructive" onClick={remove}>
            <Trash2 className="h-4 w-4" /> Excluir treino
          </Button>
        </div>
      )}
    </li>
  );
}
