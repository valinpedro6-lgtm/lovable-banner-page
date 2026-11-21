import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Sparkles, Trash2, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TrendLine } from "@/components/Charts";
import { Chip, ExerciseBrowser } from "@/components/ExerciseBrowser";
import { PageHeader, SectionTitle } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAllExercises } from "@/hooks/use-engine";
import { slugify, type Equipment, type Exercise } from "@/lib/exercises";
import { dateLabel } from "@/lib/format";
import { isMuscleId, MUSCLES, MUSCLE_LIST, type MuscleId } from "@/lib/muscles";
import { exerciseLogs, exerciseUsage, cap } from "@/lib/stats";
import { actions, uid, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

const DESC = "Biblioteca com centenas de exercícios por músculo e equipamento, seus recordes e exercícios próprios.";

export const Route = createFileRoute("/exercicios")({
  validateSearch: (s: Record<string, unknown>): { m?: MuscleId } => {
    const m = s["m"];
    return typeof m === "string" && isMuscleId(m) ? { m } : {};
  },
  head: () => ({
    meta: [
      { title: "Exercícios · MUSCLE RECOVERY" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Exercícios · MUSCLE RECOVERY" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExercisesPage,
});

function ExercisesPage() {
  const { m } = Route.useSearch();
  const all = useAllExercises();
  const app = useAppState();
  const [picked, setPicked] = useState<Exercise | null>(null);
  const [creating, setCreating] = useState(false);

  const usage = useMemo(() => exerciseUsage(app.workouts), [app.workouts]);
  const favorites = useMemo(
    () =>
      all
        .filter((e) => (usage.get(e.id) ?? 0) > 0)
        .sort((a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0))
        .slice(0, 8),
    [all, usage],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={`Biblioteca · ${all.length} exercícios`}
        title="Exercícios"
        right={
          <button
            onClick={() => setCreating(true)}
            aria-label="Criar exercício"
            className="grid h-10 w-10 place-items-center rounded-full bg-lime-gradient text-primary-foreground glow transition-transform active:scale-95"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        }
      />

      {favorites.length > 0 && (
        <section className="animate-rise">
          <SectionTitle>Seus mais usados</SectionTitle>
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
            {favorites.map((e) => (
              <button
                key={e.id}
                onClick={() => setPicked(e)}
                className="panel w-40 shrink-0 p-4 text-left transition-colors hover:border-primary"
              >
                <div className="num text-2xl font-semibold text-primary">{usage.get(e.id)}×</div>
                <div className="mt-2 line-clamp-2 text-xs font-medium leading-snug">{e.name}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{MUSCLES[e.muscle].name}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="animate-rise">
        <ExerciseBrowser
          key={m ?? "all"}
          initialMuscle={m ?? "all"}
          onPick={setPicked}
          renderAction={(e) =>
            e.custom ? (
              <span className="rounded-full border border-primary/50 px-2 py-0.5 text-[10px] text-primary">Seu</span>
            ) : (usage.get(e.id) ?? 0) > 0 ? (
              <span className="num rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">
                {usage.get(e.id)}×
              </span>
            ) : null
          }
        />
      </section>

      <ExerciseDetail exercise={picked} onClose={() => setPicked(null)} />
      <CustomExerciseSheet open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function ExerciseDetail({ exercise, onClose }: { exercise: Exercise | null; onClose: () => void }) {
  const app = useAppState();
  const logs = useMemo(
    () => (exercise ? exerciseLogs(app.workouts, exercise.id) : []),
    [app.workouts, exercise],
  );
  const best = logs.reduce((a, l) => Math.max(a, l.e1rm), 0);
  const heaviest = logs.reduce((a, l) => Math.max(a, l.load), 0);
  const last = logs.at(-1);
  const totalSets = logs.reduce((a, l) => a + l.sets, 0);
  const trend = logs
    .filter((l) => l.e1rm > 0)
    .map((l) => ({
      label: new Date(l.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      value: l.e1rm,
    }));

  return (
    <Drawer open={!!exercise} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="border-border bg-card">
        {exercise && (
          <div className="mx-auto max-h-[82vh] w-full max-w-lg overflow-y-auto px-5 pb-8">
            <DrawerHeader className="px-0 text-left">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {exercise.equipment}
                {exercise.custom && " · Personalizado"}
              </div>
              <DrawerTitle className="font-display text-xl">{exercise.name}</DrawerTitle>
              <DrawerDescription className="sr-only">Detalhes e seu histórico neste exercício</DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/musculo/$id"
                params={{ id: exercise.muscle }}
                className="rounded-full border border-primary bg-accent px-3 py-1 text-xs text-accent-foreground"
              >
                {MUSCLES[exercise.muscle].name}
              </Link>
              {exercise.secondary.map((s) => (
                <Link
                  key={s}
                  to="/musculo/$id"
                  params={{ id: s }}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  {MUSCLES[s].name}
                </Link>
              ))}
            </div>

            {logs.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border p-5 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-2 text-sm">Você ainda não registrou este exercício.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use o modo Completo ao registrar e seus recordes aparecem aqui.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <Stat icon={<Trophy className="h-3.5 w-3.5" />} label="1RM est." value={best ? `${best}kg` : "—"} />
                  <Stat label="Maior carga" value={heaviest ? `${heaviest}kg` : "—"} />
                  <Stat label="Séries" value={String(totalSets)} />
                </div>
                {trend.length >= 2 && (
                  <div className="mt-5">
                    <SectionTitle>Evolução do 1RM estimado</SectionTitle>
                    <TrendLine data={trend} suffix=" kg" />
                  </div>
                )}
                <div className="mt-5">
                  <SectionTitle>Registros</SectionTitle>
                  <ul className="divide-y divide-border/60">
                    {[...logs].reverse().slice(0, 8).map((l, i) => (
                      <li key={`${l.workoutId}-${i}`} className="flex items-center justify-between py-2.5 text-sm">
                        <span className="text-muted-foreground">{cap(dateLabel(l.date))}</span>
                        <span className="num">
                          {l.sets}×{l.reps}
                          {l.load > 0 && ` · ${l.load}kg`}
                          <span className="ml-2 text-xs text-muted-foreground">RPE {l.rpe}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  {last && <p className="mt-2 text-xs text-muted-foreground">Último: {cap(dateLabel(last.date))}</p>}
                </div>
              </>
            )}

            {exercise.custom && (
              <Button
                variant="ghost"
                className="mt-6 w-full text-destructive"
                onClick={() => {
                  actions.removeCustomExercise(exercise.id);
                  toast("Exercício removido");
                  onClose();
                }}
              >
                <Trash2 className="h-4 w-4" /> Remover exercício personalizado
              </Button>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {icon && <span className="text-primary">{icon}</span>}
        {label}
      </div>
      <div className="num mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

const EQUIPS: Equipment[] = [
  "Barra",
  "Halteres",
  "Máquina",
  "Cabo",
  "Peso corporal",
  "Smith",
  "Kettlebell",
  "Elástico",
  "Anilha",
  "Outros",
];

function CustomExerciseSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState<MuscleId | null>(null);
  const [secondary, setSecondary] = useState<MuscleId[]>([]);
  const [equipment, setEquipment] = useState<Equipment>("Halteres");

  const reset = () => {
    setName("");
    setMuscle(null);
    setSecondary([]);
    setEquipment("Halteres");
  };

  const save = () => {
    if (!name.trim() || !muscle) return;
    actions.addCustomExercise({
      id: `custom-${slugify(name)}-${uid().slice(0, 4)}`,
      name: name.trim(),
      muscle,
      secondary: secondary.filter((s) => s !== muscle),
      equipment,
      custom: true,
    });
    toast.success("Exercício criado", { description: name.trim() });
    reset();
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-border bg-card">
        <div className="mx-auto max-h-[85vh] w-full max-w-lg overflow-y-auto px-5 pb-8">
          <DrawerHeader className="px-0 text-left">
            <DrawerTitle className="font-display text-xl">Novo exercício</DrawerTitle>
            <DrawerDescription>Ele aparece na biblioteca e no registro de treinos.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do exercício"
              className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <Field label="Músculo principal">
              <div className="flex flex-wrap gap-2">
                {MUSCLE_LIST.map((x) => (
                  <Chip key={x.id} small active={muscle === x.id} onClick={() => setMuscle(x.id)}>
                    {x.name}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Músculos secundários">
              <div className="flex flex-wrap gap-2">
                {MUSCLE_LIST.filter((x) => x.id !== muscle).map((x) => (
                  <Chip
                    key={x.id}
                    small
                    active={secondary.includes(x.id)}
                    onClick={() =>
                      setSecondary((s) => (s.includes(x.id) ? s.filter((y) => y !== x.id) : [...s, x.id]))
                    }
                  >
                    {x.short}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Equipamento">
              <div className="flex flex-wrap gap-2">
                {EQUIPS.map((e) => (
                  <Chip key={e} small active={equipment === e} onClick={() => setEquipment(e)}>
                    {e}
                  </Chip>
                ))}
              </div>
            </Field>
            <Button
              variant="lime"
              size="xl"
              className={cn("w-full")}
              disabled={!name.trim() || !muscle}
              onClick={save}
            >
              Criar exercício
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
