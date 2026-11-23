import { Flame } from "lucide-react";
import { addDays, weekStart, weekStreak } from "@/lib/stats";
import type { Workout } from "@/lib/types";

const DAY = 86_400_000;

export function FocusChart({
  workouts,
  now,
  weeklyGoal,
}: {
  workouts: Workout[];
  now: number;
  weeklyGoal: number;
}) {
  const thisWeek = weekStart(now);
  const streak = weekStreak(workouts, now);
  const weeks = Array.from({ length: 8 }, (_, index) => {
    const start = addDays(thisWeek, -7 * (7 - index));
    const end = start + 7 * DAY;
    const count = workouts.filter((workout) => {
      const time = new Date(workout.date).getTime();
      return time >= start && time < end;
    }).length;
    return { label: index === 7 ? "Agora" : `S${index + 1}`, count, current: index === 7 };
  });
  const goal = Math.max(1, weeklyGoal);

  return (
    <section className="panel p-5 animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Foco · 8 semanas
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold">Ofensiva de constância</h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs">
          <Flame className="h-3.5 w-3.5 text-orange-300" />
          <span className="num font-semibold">{streak}</span>
          <span className="text-muted-foreground">sem</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Treinos concluídos por semana · meta atual de {goal} {goal === 1 ? "treino" : "treinos"}
      </p>
      <div
        className="mt-5 grid h-28 grid-cols-8 items-end gap-2"
        role="img"
        aria-label="Gráfico de constância semanal"
      >
        {weeks.map((week) => {
          const percent = Math.min(100, (week.count / goal) * 100);
          return (
            <div
              key={week.label}
              className="flex h-full flex-col items-center justify-end gap-1.5"
              title={`${week.label}: ${week.count} treinos`}
            >
              <span className="num text-[9px] text-muted-foreground">{week.count || ""}</span>
              <div className="flex h-[76px] w-full items-end overflow-hidden rounded-lg bg-white/[0.05]">
                <div
                  className={`w-full rounded-lg transition-[height] duration-500 ${week.count >= goal ? "bg-silver-gradient" : week.count > 0 ? "bg-white/30" : "bg-transparent"}`}
                  style={{ height: `${Math.max(week.count ? 12 : 0, percent)}%` }}
                />
              </div>
              <span
                className={`text-[8px] ${week.current ? "text-foreground" : "text-muted-foreground"}`}
              >
                {week.label}
              </span>
            </div>
          );
        })}
      </div>
      {workouts.length === 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Registre treinos para acender sua sequência. Dias de descanso também fazem parte do ritmo.
        </p>
      )}
    </section>
  );
}
