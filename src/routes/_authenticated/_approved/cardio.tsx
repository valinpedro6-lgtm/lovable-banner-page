import { createFileRoute } from "@tanstack/react-router";
import { Activity, Clock3, HeartPulse } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/PageHeader";
import { CARDIO_ACTIVITY_OPTIONS, parseCardioPreset } from "@/lib/cardio-timer";
import type { CardioActivity } from "@/lib/types";
import { useAppState } from "@/lib/store";

interface CardioSearch {
  activity?: CardioActivity;
  minutes?: number;
  nonce?: number;
}

const FOCUS: Record<CardioActivity, { duration: number; text: string }> = {
  Corrida: { duration: 25, text: "Ritmo contínuo ou intervalos leves" },
  Bicicleta: { duration: 30, text: "Cadência confortável e constante" },
  Caminhada: { duration: 35, text: "Base aeróbica com baixo impacto" },
  "Caminhada inclinada": { duration: 25, text: "Inclinação moderada e passada firme" },
  Elíptico: { duration: 25, text: "Movimento contínuo e confortável" },
  Remo: { duration: 20, text: "Técnica primeiro, ritmo consistente" },
  Corda: { duration: 12, text: "Blocos curtos com pausas controladas" },
  Escada: { duration: 15, text: "Subidas constantes sem perder a técnica" },
  Natação: { duration: 30, text: "Séries contínuas ou intervaladas na piscina" },
  Dança: { duration: 30, text: "Cardio divertido, livre e sustentável" },
  HIIT: { duration: 16, text: "Blocos fortes alternados com recuperação" },
};

export const Route = createFileRoute("/_authenticated/_approved/cardio")({
  validateSearch: (search: Record<string, unknown>): CardioSearch => {
    const preset = parseCardioPreset(search);
    return preset
      ? { activity: preset.activity, minutes: preset.minutes, nonce: preset.nonce }
      : {};
  },
  head: () => ({
    meta: [
      { title: "Cardio · MUSCLE RECOVERY" },
      {
        name: "description",
        content: "Escolha uma modalidade, configure seu timer e acompanhe o cardio.",
      },
      { property: "og:title", content: "Cardio · MUSCLE RECOVERY" },
      {
        property: "og:description",
        content: "Escolha uma modalidade, configure seu timer e acompanhe o cardio.",
      },
    ],
  }),
  component: CardioPage,
});

function CardioPage() {
  const app = useAppState();
  const sessions = app.workouts
    .filter((workout) => workout.cardio)
    .slice(-5)
    .reverse();

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Condicionamento" title="Cardio" />
      <section className="panel flex items-start gap-3 p-4 animate-rise">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
          <HeartPulse className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-medium">Escolha seu estímulo</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Corrida, bike, caminhada, piscina, dança ou intervalos: escolha uma opção abaixo e use o
            timer para registrar a sessão. O timer fica somente nesta aba.
          </p>
        </div>
      </section>

      <section className="space-y-3 animate-rise">
        <div className="flex items-center justify-between">
          <SectionTitle>Modalidades</SectionTitle>
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {CARDIO_ACTIVITY_OPTIONS.length} opções
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CARDIO_ACTIVITY_OPTIONS.map((option) => {
            const focus = FOCUS[option.value];
            return (
              <div
                key={option.value}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex items-start gap-2">
                  <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium">{option.label}</h3>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                      {focus.text}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-primary">
                  <Clock3 className="h-3 w-3" /> sugestão: {focus.duration} min
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {sessions.length > 0 && (
        <section className="panel space-y-3 p-5 animate-rise">
          <SectionTitle>Últimas sessões</SectionTitle>
          <ul className="divide-y divide-border/60">
            {sessions.map((workout) => (
              <li key={workout.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{workout.cardio?.activity}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(workout.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
                <span className="num text-primary">
                  {Math.round((workout.cardio?.durationSeconds ?? 0) / 60)} min
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
