import { createFileRoute } from "@tanstack/react-router";
import { HeartPulse } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { parseCardioPreset } from "@/lib/cardio-timer";
import type { CardioActivity } from "@/lib/types";

interface CardioSearch {
  activity?: CardioActivity;
  minutes?: number;
  nonce?: number;
}

export const Route = createFileRoute("/cardio")({
  validateSearch: (search: Record<string, unknown>): CardioSearch => {
    const preset = parseCardioPreset(search);
    return preset
      ? { activity: preset.activity, minutes: preset.minutes, nonce: preset.nonce }
      : {};
  },
  head: () => ({
    meta: [
      { title: "Cardio · MUSCLE RECOVERY" },
      { name: "description", content: "Timer de cardio, lembretes por minuto e notificações." },
      { property: "og:title", content: "Cardio · MUSCLE RECOVERY" },
      {
        property: "og:description",
        content: "Timer de cardio, lembretes por minuto e notificações.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CardioPage,
});

function CardioPage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Condicionamento" title="Cardio" />
      <section className="panel flex items-start gap-3 p-4 animate-rise">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
          <HeartPulse className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-medium">Seu espaço de cardio</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Independente da divisão de musculação: configure a atividade e a duração, programe
            lembretes em minutos específicos e ative as notificações.
          </p>
        </div>
      </section>
    </div>
  );
}
