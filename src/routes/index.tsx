import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, ChevronRight, HeartPulse, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { BodyMap } from "@/components/BodyMap";
import { CheckInSheet } from "@/components/CheckInSheet";
import { Disclaimer, PageHeader, SectionTitle } from "@/components/PageHeader";
import { RecoveryRing } from "@/components/RecoveryRing";
import { RecoveryLegend, ViewToggle } from "@/components/ViewToggle";
import { Button } from "@/components/ui/button";
import { useEngine } from "@/hooks/use-engine";
import { relTime } from "@/lib/format";
import { MUSCLES, type MuscleId } from "@/lib/muscles";
import { BAND_COLOR } from "@/lib/recovery";
import { sampleWorkouts } from "@/lib/sample";
import { actions } from "@/lib/store";
import { workoutSets, workoutTitle } from "@/lib/workout-utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel · MUSCLE RECOVERY" },
      {
        name: "description",
        content: "Recuperação geral, mapa muscular e sugestão do próximo treino em tempo real.",
      },
      { property: "og:title", content: "Painel · MUSCLE RECOVERY" },
      {
        property: "og:description",
        content: "Recuperação geral, mapa muscular e sugestão do próximo treino em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { states, overall, recommendation, lastWorkout, latestCheckIn, now, app } = useEngine();
  const [view, setView] = useState<"front" | "back">("front");
  const navigate = useNavigate();

  const recovered = states.filter((s) => s.pct >= 90).length;
  const recovering = states.length - recovered;
  const fills = Object.fromEntries(states.map((s) => [s.muscle, BAND_COLOR[s.band]])) as Record<
    MuscleId,
    string
  >;
  const checkInFresh =
    latestCheckIn && now - new Date(latestCheckIn.date).getTime() < 20 * 3_600_000;
  const greeting = app.profile.name ? `Olá, ${app.profile.name.split(" ")[0]}` : "Status do corpo";
  const today = new Date(now).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={`Muscle Recovery · ${today}`} title={greeting} />

      {/* Overall */}
      <section className="panel relative overflow-hidden p-5 animate-rise">
        <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
          Ao vivo
        </div>
        <div className="flex items-center gap-5">
          <RecoveryRing pct={overall} size={148} stroke={11} label="Geral" />
          <div className="flex-1 space-y-4">
            <Stat value={recovered} label="Recuperados" color="var(--rec-full)" />
            <Stat value={recovering} label="Em recuperação" color="var(--rec-mid)" />
          </div>
        </div>
      </section>

      {!checkInFresh && (
        <CheckInSheet>
          <button className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border p-4 text-left transition-colors hover:border-primary animate-rise">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground">
              <HeartPulse className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium">Como você está hoje?</span>
              <span className="block text-xs text-muted-foreground">
                Dor, fadiga e disposição refinam a estimativa
              </span>
            </span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </CheckInSheet>
      )}

      {/* Body map */}
      <section className="panel p-5 animate-rise">
        <div className="mb-2 flex items-center justify-between">
          <SectionTitle>Mapa muscular</SectionTitle>
          <ViewToggle value={view} onChange={setView} />
        </div>
        <div className="mx-auto h-[400px] w-full max-w-[280px]">
          <BodyMap
            view={view}
            fills={fills}
            onSelect={(m) => navigate({ to: "/musculo/$id", params: { id: m } })}
          />
        </div>
        <p className="mb-3 text-center text-xs text-muted-foreground">Toque num músculo para detalhes</p>
        <RecoveryLegend />
      </section>

      {/* Next workout */}
      <section className="panel relative overflow-hidden p-5 animate-rise">
        <SectionTitle>Próximo treino</SectionTitle>
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lime-gradient text-primary-foreground glow">
            {recommendation.kind === "train" ? <Zap className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-semibold">{recommendation.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{recommendation.reason}</p>
            {recommendation.muscles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {recommendation.muscles.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-primary/50 bg-accent px-3 py-1 text-xs text-accent-foreground"
                  >
                    {MUSCLES[m].name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {recommendation.kind === "train" && (
          <Button asChild variant="lime" size="pill" className="mt-4 w-full">
            <Link to="/registrar">Registrar este treino</Link>
          </Button>
        )}
      </section>

      {/* Last workout */}
      <section className="panel p-5 animate-rise">
        <SectionTitle
          action={
            <Link to="/historico" className="flex items-center gap-1 text-xs text-primary">
              Histórico <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          Último treino
        </SectionTitle>
        {lastWorkout ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{workoutTitle(lastWorkout)}</div>
              <div className="text-xs text-muted-foreground">
                {relTime(new Date(lastWorkout.date).getTime(), now)} · {lastWorkout.entries.length}{" "}
                exercícios
              </div>
            </div>
            <div className="text-right">
              <div className="num text-2xl font-semibold">{workoutSets(lastWorkout)}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">séries</div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Nenhum treino ainda. Registre o primeiro ou veja o app com dados de exemplo.
            </p>
            <div className="flex gap-2">
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
        )}
      </section>

      <Disclaimer />
    </div>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="num text-3xl font-semibold">{value}</span>
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
