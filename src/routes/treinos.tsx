import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Dumbbell,
  HeartPulse,
  Moon,
  Repeat,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Disclaimer, PageHeader, SectionTitle } from "@/components/PageHeader";
import { CardioTimer } from "@/components/CardioTimer";
import { RecoveryRing } from "@/components/RecoveryRing";
import { Button } from "@/components/ui/button";
import { useEngine } from "@/hooks/use-engine";
import { MUSCLES } from "@/lib/muscles";
import {
  adjustSets,
  bestDay,
  exerciseFor,
  planKey,
  PROGRAMS,
  programFor,
  rankDays,
  type CardioPrescription,
  type Program,
  type RankedDay,
} from "@/lib/programs";
import { BAND_COLOR, bandFor } from "@/lib/recovery";
import { actions } from "@/lib/store";
import {
  dateInWeek,
  localDateKey,
  normalizeTrainingDays,
  scheduleAnchorDate,
  scheduledProgramDay,
  WEEKDAYS,
} from "@/lib/training-schedule";
import type { Experience } from "@/lib/types";
import { cn } from "@/lib/utils";

const DESC = "Escolha sua divisão de treino e pegue o treino que o app indica para hoje, já montado.";

export const Route = createFileRoute("/treinos")({
  head: () => ({
    meta: [
      { title: "Treinos prontos · MUSCLE RECOVERY" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Treinos prontos · MUSCLE RECOVERY" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const { app, states, workouts, now, recommendation } = useEngine();
  const program = programFor(app.profile.split);
  const [choosing, setChoosing] = useState(false);
  const [timerPreset, setTimerPreset] = useState<
    (CardioPrescription & { nonce: number }) | undefined
  >();
  const [timerPresetNonce, setTimerPresetNonce] = useState(0);
  const ranked = useMemo(() => rankDays(program, states, workouts, now), [program, states, workouts, now]);
  const best = bestDay(ranked);
  const exp = app.profile.experience;
  const restDay = recommendation.kind === "rest" && recommendation.title === "Descanso ativo";
  const trainingDays = normalizeTrainingDays(app.profile.trainingDays);
  const scheduleStart = app.profile.trainingScheduleStart || scheduleAnchorDate(trainingDays, new Date(now));
  const currentDate = new Date(now);
  const calendarReference = scheduleStart > localDateKey(currentDate)
    ? new Date(`${scheduleStart}T00:00:00`)
    : currentDate;
  const useCardioPreset = (cardio: CardioPrescription) => {
    const nonce = timerPresetNonce + 1;
    setTimerPresetNonce(nonce);
    setTimerPreset({ ...cardio, nonce });
    window.setTimeout(
      () =>
        document
          .getElementById("cardio-timer")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50,
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Treinos prontos" title="O que treinar hoje" />

      {/* Current split */}
      <section className="panel p-4 animate-rise">
        <button onClick={() => setChoosing((c) => !c)} className="flex w-full items-center gap-3 text-left">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
            <Repeat className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Sua divisão</span>
            <span className="block truncate font-medium">{program.name}</span>
            <span className="block text-xs text-muted-foreground">
              {program.days.length} treinos · {program.freq}
            </span>
          </span>
          <span className="flex items-center gap-1 text-xs text-primary">
            Trocar <ChevronDown className={cn("h-4 w-4 transition-transform", choosing && "rotate-180")} />
          </span>
        </button>
        {choosing && (
          <div className="mt-4 border-t border-border/60 pt-4">
            <ProgramPicker
              value={program.id}
              onChange={(id) => {
                actions.updateProfile({ split: id, trainingScheduleStart: scheduleAnchorDate(trainingDays, new Date(now)) });
                setChoosing(false);
              }}
            />
          </div>
        )}
      </section>

      {program.id === "livre" ? (
        <section className="panel flex items-start gap-3 p-4 animate-rise">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-medium">Agenda semanal</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Na divisão Livre, o app escolhe o treino pela sua recuperação. Escolha uma divisão fixa para organizar os dias da semana.
            </p>
          </div>
        </section>
      ) : (
        <section className="panel p-4 animate-rise">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-medium">Agenda semanal</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Marque seus dias. O primeiro dia marcado recebe a primeira sessão da divisão; depois a sequência continua automaticamente.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {WEEKDAYS.map((weekday) => {
              const selected = trainingDays.includes(weekday.value);
              return (
                <button
                  key={weekday.value}
                  type="button"
                  aria-label={`Treinar ${weekday.label}`}
                  aria-pressed={selected}
                  disabled={selected && trainingDays.length === 1}
                  onClick={() => {
                    const next = normalizeTrainingDays(
                      selected
                        ? trainingDays.filter((day) => day !== weekday.value)
                        : [...trainingDays, weekday.value],
                    );
                    if (next.length === 0) return;
                    actions.updateProfile({
                      trainingDays: next,
                      weeklyFrequency: next.length,
                      trainingScheduleStart: scheduleAnchorDate(next, new Date(now)),
                    });
                  }}
                  className={cn(
                    "flex h-11 items-center justify-center gap-1 rounded-xl border text-xs font-medium transition-colors disabled:cursor-not-allowed",
                    selected
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:border-muted-foreground",
                  )}
                >
                  {selected && <Check className="h-3.5 w-3.5" />}
                  {weekday.short}
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {WEEKDAYS.map((weekday) => {
              const date = dateInWeek(calendarReference, weekday.value);
              const day = scheduledProgramDay(program, trainingDays, scheduleStart, date);
              return (
                <div
                  key={weekday.value}
                  className={cn(
                    "min-w-0 rounded-xl border px-3 py-2.5",
                    day ? "border-primary/30 bg-accent/30" : "border-border/60 bg-surface/40",
                  )}
                >
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {weekday.label}
                  </div>
                  <div className={cn("mt-1 truncate text-xs", day ? "text-foreground" : "text-muted-foreground")}>
                    {day?.name ?? "Descanso"}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
            Se a divisão tiver mais sessões que dias marcados, o ciclo continua na semana seguinte.
          </p>
        </section>
      )}

      <CardioTimer key={timerPreset?.nonce ?? 0} preset={timerPreset} />

      {/* Recommended */}
      {best && (
        <section className="panel relative overflow-hidden p-5 animate-rise">
          <div className="pointer-events-none absolute -top-24 -right-24 h-60 w-60 rounded-full bg-primary/15 blur-3xl" />
          <div className="mb-3 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
            {restDay ? <Moon className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
            {restDay ? "Hoje o ideal é descansar" : "Indicado pra você agora"}
          </div>
          <div className="flex items-center gap-4">
            <RecoveryRing pct={best.readiness} size={96} stroke={8} label="Prontidão" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-xl font-semibold leading-tight">{best.day.name}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {restDay
                  ? "Você relatou muita fadiga. Se for treinar mesmo assim, este é o mais leve pro seu corpo."
                  : reasonFor(best)}
              </p>
            </div>
          </div>
          <MuscleChips day={best} />
          <ExerciseList day={best} exp={exp} />
          {best.day.cardio && (
            <CardioRecommendation cardio={best.day.cardio} onUse={useCardioPreset} />
          )}
          <Button asChild variant="lime" size="xl" className="mt-4 w-full">
            <Link to="/registrar" search={{ plano: planKey(program, best.day) }}>
              <Dumbbell className="h-5 w-5" /> Pegar este treino
            </Link>
          </Button>
        </section>
      )}

      {/* All days */}
      <section className="animate-rise">
        <SectionTitle>Todos os treinos de {program.name}</SectionTitle>
        <ul className="space-y-3">
          {ranked.map((r) => (
            <DayCard
              key={r.day.id}
              r={r}
              program={program}
              exp={exp}
              best={r.day.id === best?.day.id}
              onUseCardio={useCardioPreset}
            />
          ))}
        </ul>
      </section>

      <p className="text-center text-[11px] text-muted-foreground">
        Séries ajustadas ao seu nível ({expLabel(exp)}). Mude em{" "}
        <Link to="/perfil" className="text-primary">
          Perfil
        </Link>
        .
      </p>
      <Disclaimer />
    </div>
  );
}

function reasonFor(r: RankedDay): string {
  const parts: string[] = [];
  if (r.tired.length === 0) parts.push("Todos os músculos deste treino estão recuperados");
  else parts.push(`${r.tired.map((m) => MUSCLES[m].short).join(", ")} ainda se recuperando`);
  if (r.isNext) parts.push("é o próximo da sua sequência");
  return parts.join(" · ") + ".";
}

function expLabel(e: Experience) {
  return e === "iniciante" ? "iniciante" : e === "avancado" ? "avançado" : "intermediário";
}

function MuscleChips({ day }: { day: RankedDay }) {
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {day.muscles.map((m) => {
        const tired = day.tired.includes(m);
        return (
          <span
            key={m}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px]",
              tired ? "border-rec-mid/60 text-rec-mid" : "border-primary/50 bg-accent text-accent-foreground",
            )}
          >
            {MUSCLES[m].short}
          </span>
        );
      })}
    </div>
  );
}

function ExerciseList({ day, exp }: { day: RankedDay; exp: Experience }) {
  return (
    <ol className="mt-4 space-y-2">
      {day.day.items.map(([name, sets, reps], i) => {
        const ex = exerciseFor(name);
        return (
          <li key={name} className="flex items-center gap-3 text-sm">
            <span className="num w-5 text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <span className="min-w-0 flex-1 truncate">{name}</span>
            {ex && <span className="hidden text-[10px] text-muted-foreground sm:inline">{ex.equipment}</span>}
            <span className="num shrink-0 text-xs">
              {adjustSets(sets, i, exp)}×{reps}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function DayCard({
  r,
  program,
  exp,
  best,
  onUseCardio,
}: {
  r: RankedDay;
  program: Program;
  exp: Experience;
  best: boolean;
  onUseCardio: (cardio: CardioPrescription) => void;
}) {
  const [open, setOpen] = useState(false);
  const color = BAND_COLOR[bandFor(r.readiness)];
  return (
    <li className={cn("panel overflow-hidden", best && "border-primary/50")}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 p-4 text-left">
        <div className="num w-12 shrink-0 text-2xl font-semibold" style={{ color }}>
          {r.readiness}
          <span className="text-xs text-muted-foreground">%</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{r.day.name}</span>
            {r.isNext && (
              <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                Próximo
              </span>
            )}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {r.day.items.length} exercícios · {r.muscles.map((m) => MUSCLES[m].short).join(", ")}
          </div>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-border/60 px-4 pb-4">
          <MuscleChips day={r} />
          <ExerciseList day={r} exp={exp} />
        </div>
      )}
      <div className="px-4 pb-4">
        <Button asChild variant={best ? "lime" : "chip"} size="pill" className="w-full">
          <Link to="/registrar" search={{ plano: planKey(program, r.day) }}>
            Pegar treino
          </Link>
        </Button>
        {r.day.cardio && (
          <div className="mt-3">
            <CardioRecommendation cardio={r.day.cardio} onUse={onUseCardio} compact />
          </div>
        )}
      </div>
    </li>
  );
}

function CardioRecommendation({
  cardio,
  onUse,
  compact = false,
}: {
  cardio: CardioPrescription;
  onUse: (cardio: CardioPrescription) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border border-primary/25 bg-accent/20 p-3", compact && "p-3")}>
      <div className="flex items-start gap-2">
        <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium">
            Cardio · {cardio.activity} · {cardio.minutes} min
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{cardio.focus}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onUse(cardio)}
        className="mt-2 text-xs font-medium text-primary hover:underline"
      >
        Usar esta sugestão no timer
      </button>
    </div>
  );
}

export function ProgramPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <ul className="grid gap-2">
      {PROGRAMS.map((p) => {
        const on = p.id === value;
        return (
          <li key={p.id}>
            <button
              onClick={() => onChange(p.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors",
                on ? "border-primary bg-accent" : "border-border hover:border-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}
              >
                {on && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2">
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.level}</span>
                </span>
                <span className="block text-xs text-muted-foreground">{p.description}</span>
                <span className="num mt-0.5 block text-[11px] text-primary">
                  {p.days.length} treinos · {p.freq}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
