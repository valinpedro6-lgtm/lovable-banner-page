import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronDown, Dumbbell, Moon, Repeat, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Disclaimer, PageHeader, SectionTitle } from "@/components/PageHeader";
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
  type Program,
  type RankedDay,
} from "@/lib/programs";
import { BAND_COLOR, bandFor } from "@/lib/recovery";
import { actions } from "@/lib/store";
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
  const ranked = useMemo(() => rankDays(program, states, workouts, now), [program, states, workouts, now]);
  const best = bestDay(ranked);
  const exp = app.profile.experience;
  const restDay = recommendation.kind === "rest" && recommendation.title === "Descanso ativo";

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
                actions.updateProfile({ split: id });
                setChoosing(false);
              }}
            />
          </div>
        )}
      </section>

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
            <DayCard key={r.day.id} r={r} program={program} exp={exp} best={r.day.id === best?.day.id} />
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

function DayCard({ r, program, exp, best }: { r: RankedDay; program: Program; exp: Experience; best: boolean }) {
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
      </div>
    </li>
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
