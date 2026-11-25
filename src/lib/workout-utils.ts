import { EXERCISE_MAP } from "./exercises";
import { MUSCLES, type MuscleId } from "./muscles";
import type { Workout, WorkoutEntry, WorkoutSet } from "./types";

export function entrySets(entry: WorkoutEntry): WorkoutSet[] {
  if (entry.setDetails?.length) return entry.setDetails;
  return Array.from({ length: entry.sets }, () => ({
    reps: entry.reps,
    load: entry.load,
    rpe: entry.rpe,
  }));
}

export function workoutMuscles(w: Workout): MuscleId[] {
  return [...new Set(w.entries.map((e) => e.muscle))];
}

export function workoutSets(w: Workout): number {
  return w.entries.reduce((a, e) => a + e.sets, 0);
}

export function workoutVolume(w: Workout): number {
  return w.entries.reduce(
    (total, entry) => total + entrySets(entry).reduce((sum, set) => sum + set.reps * set.load, 0),
    0,
  );
}

export function workoutTitle(w: Workout): string {
  const ms = workoutMuscles(w).map((m) => MUSCLES[m].short);
  if (w.cardio && ms.length === 0) return `Cardio · ${w.cardio.activity}`;
  if (w.cardio) return `${ms.slice(0, 3).join(" · ")} · ${w.cardio.activity}`;
  if (w.kind === "quick") return `Treino rápido · ${ms.join(", ")}`;
  return ms.slice(0, 3).join(" · ") + (ms.length > 3 ? ` +${ms.length - 3}` : "");
}

export function exerciseName(
  id: string | undefined,
  custom: { id: string; name: string }[] = [],
): string {
  if (!id) return "Estímulo rápido";
  return EXERCISE_MAP[id]?.name ?? custom.find((c) => c.id === id)?.name ?? "Exercício";
}
