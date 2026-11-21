import { EXERCISE_MAP } from "./exercises";
import { MUSCLES, type MuscleId } from "./muscles";
import type { Workout } from "./types";

export function workoutMuscles(w: Workout): MuscleId[] {
  return [...new Set(w.entries.map((e) => e.muscle))];
}

export function workoutSets(w: Workout): number {
  return w.entries.reduce((a, e) => a + e.sets, 0);
}

export function workoutVolume(w: Workout): number {
  return w.entries.reduce((a, e) => a + e.sets * e.reps * e.load, 0);
}

export function workoutTitle(w: Workout): string {
  const ms = workoutMuscles(w).map((m) => MUSCLES[m].short);
  if (w.kind === "quick") return `Treino rápido · ${ms.join(", ")}`;
  return ms.slice(0, 3).join(" · ") + (ms.length > 3 ? ` +${ms.length - 3}` : "");
}

export function exerciseName(id: string | undefined, custom: { id: string; name: string }[] = []): string {
  if (!id) return "Estímulo rápido";
  return EXERCISE_MAP[id]?.name ?? custom.find((c) => c.id === id)?.name ?? "Exercício";
}
