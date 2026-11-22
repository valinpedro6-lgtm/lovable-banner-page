import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, Circle, ClipboardList, Minus, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BodyMap } from "@/components/BodyMap";
import { ExerciseBrowser } from "@/components/ExerciseBrowser";
import { PageHeader } from "@/components/PageHeader";
import { ViewToggle } from "@/components/ViewToggle";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useAppState, actions, uid } from "@/lib/store";
import type { Exercise } from "@/lib/exercises";
import { toLocalInput } from "@/lib/format";
import { MUSCLES, type MuscleId } from "@/lib/muscles";
import type { WorkoutEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { buildEntries, lastLoads, parsePlan, planKey, type PlanDay, type Program } from "@/lib/programs";

export const Route = createFileRoute("/_authenticated/_approved/registrar")({
  validateSearch: (s: Record<string, unknown>): { plano?: string } => {
    const p = s["plano"];
    return typeof p === "string" && p ? { plano: p } : {};
  },
  head: () => ({
    meta: [
      { title: "Registrar treino · MUSCLE RECOVERY" },
      { name: "description", content: "Registre exercícios, séries, cargas e RPE em segundos." },
      { property: "og:title", content: "Registrar treino · MUSCLE RECOVERY" },
      { property: "og:description", content: "Registre exercícios, séries, cargas e RPE em segundos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { plano } = Route.useSearch();
  return <RegisterBody key={plano ?? "none"} plano={plano} />;
}

function RegisterBody({ plano }: { plano: string | undefined }) {
  const plan = parsePlan(plano);
  const [mode, setMode] = useState<"full" | "quick">(plan ? "full" : "quick");
  return (
    <div>
      <PageHeader eyebrow="Novo registro" title={mode === "quick" ? "Músculos treinados" : "Treino completo"} />
      <div className="mb-5 grid grid-cols-2 rounded-full border border-border bg-surface p-1 text-sm font-medium">
        {(
          [
            ["quick", "Rápido"],
            ["full", "Completo"],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setMode(v)}
            className={cn(
              "h-10 rounded-full transition-colors",
              mode === v ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>
      {!plan && (
        <Link
          to="/treinos"
          className="mb-5 flex items-center gap-3 rounded-2xl border border-primary/40 bg-accent/40 p-4 transition-colors hover:border-primary"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime-gradient text-primary-foreground">
            <ClipboardList className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium">Usar um treino pronto</span>
            <span className="block text-xs text-muted-foreground">O app indica o melhor treino para hoje</span>
          </span>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      )}
      {mode === "quick" ? <QuickWorkout /> : <FullWorkout plan={plan} />}
    </div>
  );
}

/* ---------------- Quick mode (reference design) ---------------- */

const FRONT_CHIPS: MuscleId[] = ["deltoides", "peitoral", "biceps", "antebracos", "abdomen", "quadriceps", "panturrilhas", "trapezio"];
const BACK_CHIPS: MuscleId[] = ["trapezio", "deltoides", "dorsais", "triceps", "lombar", "gluteos", "posteriores", "panturrilhas"];

const INTENSITY = [
  { id: 1, label: "Leve", sets: 4, rpe: 6 },
  { id: 2, label: "Moderado", sets: 8, rpe: 8 },
  { id: 3, label: "Intenso", sets: 12, rpe: 9 },
] as const;

function QuickWorkout() {
  const navigate = useNavigate();
  const [view, setView] = useState<"front" | "back">("front");
  const [selected, setSelected] = useState<MuscleId[]>([]);
  const [intensity, setIntensity] = useState<1 | 2 | 3>(2);
  const [date, setDate] = useState(() => toLocalInput(new Date()));

  const toggle = (m: MuscleId) =>
    setSelected((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));

  const fills = Object.fromEntries(selected.map((m) => [m, "var(--primary)"]));
  const chips = view === "front" ? FRONT_CHIPS : BACK_CHIPS;

  const save = () => {
    const lvl = INTENSITY.find((i) => i.id === intensity) ?? INTENSITY[1];
    actions.addWorkout({
      id: uid(),
      kind: "quick",
      date: new Date(date).toISOString(),
      entries: selected.map((m) => ({
        id: uid(),
        muscle: m,
        secondary: [],
        sets: lvl.sets,
        reps: 10,
        load: 0,
        rpe: lvl.rpe,
      })),
    });
    toast.success("Treino registrado", { description: "Recuperação atualizada." });
    navigate({ to: "/" });
  };

  return (
    <div className="animate-rise">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Selecione os grupos musculares</p>
        <ViewToggle value={view} onChange={setView} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-center gap-2">
        <div className="flex flex-col items-start gap-2.5 py-4">
          {chips.map((m) => {
            const on = selected.includes(m);
            return (
              <button
                key={m}
                onClick={() => toggle(m)}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-full border-2 pr-4 pl-2 text-sm font-medium transition-all active:scale-95",
                  on ? "border-primary text-foreground" : "border-border text-muted-foreground",
                )}
              >
                {on ? (
                  <CheckCircle2 className="h-6 w-6 fill-primary text-primary-foreground" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
                {MUSCLES[m].short}
              </button>
            );
          })}
        </div>
        <div className="h-[440px]">
          <BodyMap view={view} fills={fills} highlighted={selected} onSelect={toggle} />
        </div>
      </div>

      <div className="mt-2 space-y-4">
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Intensidade
          </div>
          <div className="grid grid-cols-3 gap-2">
            {INTENSITY.map((i) => (
              <button
                key={i.id}
                onClick={() => setIntensity(i.id)}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-colors",
                  intensity === i.id ? "border-primary bg-accent" : "border-border",
                )}
              >
                <div className="text-sm font-medium">{i.label}</div>
                <div className="num text-[11px] text-muted-foreground">
                  ~{i.sets} séries · RPE {i.rpe}
                </div>
              </button>
            ))}
          </div>
        </div>
        <DateField value={date} onChange={setDate} />
        <Button variant="lime" size="xl" className="w-full" disabled={!selected.length} onClick={save}>
          Concluir {selected.length > 0 && `· ${selected.length}`}
        </Button>
      </div>
    </div>
  );
}

function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
      <span className="text-sm text-muted-foreground">Data e horário</span>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="num bg-transparent text-right text-sm outline-none [color-scheme:dark]"
      />
    </label>
  );
}

/* ---------------- Full mode ---------------- */

interface Draft extends WorkoutEntry {
  name: string;
}

function FullWorkout({ plan }: { plan: { program: Program; day: PlanDay } | null }) {
  const navigate = useNavigate();
  const app = useAppState();
  const [date, setDate] = useState(() => toLocalInput(new Date()));
  const lastLoad = useMemo(() => lastLoads(app.workouts), [app.workouts]);
  const [entries, setEntries] = useState<Draft[]>(() =>
    plan ? buildEntries(plan.day, app.profile.experience, lastLoad).map((e) => ({ ...e, id: uid() })) : [],
  );
  const [picker, setPicker] = useState(false);

  const add = (ex: Exercise) => {
    setEntries((s) => [
      ...s,
      {
        id: uid(),
        exerciseId: ex.id,
        name: ex.name,
        muscle: ex.muscle,
        secondary: ex.secondary,
        sets: 3,
        reps: 10,
        load: lastLoad.get(ex.id) ?? 0,
        rpe: 8,
      },
    ]);
    setPicker(false);
  };

  const update = (id: string, patch: Partial<Draft>) =>
    setEntries((s) => s.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const save = () => {
    actions.addWorkout({
      id: uid(),
      kind: "full",
      date: new Date(date).toISOString(),
      ...(plan ? { planId: planKey(plan.program, plan.day) } : {}),
      entries: entries.map(({ name: _n, ...e }) => e),
    });
    toast.success("Treino salvo", { description: `${entries.length} exercícios registrados.` });
    navigate({ to: "/" });
  };

  return (
    <div className="space-y-4 animate-rise">
      {plan && (
        <div className="panel flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-primary">Treino pronto · {plan.program.name}</div>
            <div className="truncate font-display text-base font-semibold">{plan.day.name}</div>
            <div className="text-xs text-muted-foreground">Ajuste cargas e séries como quiser antes de salvar.</div>
          </div>
          <Link to="/treinos" className="shrink-0 text-xs text-primary">
            Trocar
          </Link>
        </div>
      )}
      <DateField value={date} onChange={setDate} />

      {entries.map((e, idx) => (
        <div key={e.id} className="panel p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="num text-[10px] text-muted-foreground">#{String(idx + 1).padStart(2, "0")}</div>
              <div className="truncate font-medium">{e.name}</div>
              <div className="text-xs text-primary">{MUSCLES[e.muscle].name}</div>
            </div>
            <button
              aria-label="Remover"
              onClick={() => setEntries((s) => s.filter((x) => x.id !== e.id))}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stepper label="Séries" value={e.sets} min={1} max={20} onChange={(v) => update(e.id, { sets: v })} />
            <Stepper label="Reps" value={e.reps} min={1} max={50} onChange={(v) => update(e.id, { reps: v })} />
            <Stepper label="Carga kg" value={e.load} min={0} max={500} step={2.5} onChange={(v) => update(e.id, { load: v })} />
          </div>
          <div className="mt-3">
            <div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
              <span>Intensidade percebida</span>
              <span className="num text-foreground">RPE {e.rpe}</span>
            </div>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => update(e.id, { rpe: n })}
                  className={cn(
                    "num h-8 rounded-md text-xs transition-colors",
                    n <= e.rpe ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground",
                  )}
                  style={n <= e.rpe ? { opacity: 0.35 + (n / 10) * 0.65 } : undefined}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={() => setPicker(true)}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/60 text-sm font-medium text-primary transition-colors hover:bg-accent"
      >
        <Plus className="h-4 w-4" /> Adicionar exercício
      </button>

      <Button variant="lime" size="xl" className="w-full" disabled={!entries.length} onClick={save}>
        Salvar treino
      </Button>

      <Drawer open={picker} onOpenChange={setPicker}>
        <DrawerContent className="h-[88vh] border-border bg-card">
          <div className="mx-auto w-full max-w-lg overflow-y-auto px-5 pb-10">
            <DrawerHeader className="px-0 text-left">
              <DrawerTitle className="font-display text-xl">Escolher exercício</DrawerTitle>
            </DrawerHeader>
            <ExerciseBrowser
              onPick={add}
              renderAction={(ex) => (
                <button
                  onClick={() => add(ex)}
                  aria-label={`Adicionar ${ex.name}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-primary"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div className="rounded-xl bg-surface-2 p-2">
      <div className="mb-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex items-center justify-between">
        <button aria-label={`Diminuir ${label}`} onClick={() => onChange(clamp(value - step))} className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground active:bg-secondary">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value.replace(",", "."));
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
          className="num w-12 bg-transparent text-center text-lg font-semibold outline-none"
        />
        <button aria-label={`Aumentar ${label}`} onClick={() => onChange(clamp(value + step))} className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground active:bg-secondary">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
