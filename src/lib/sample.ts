import { EXERCISE_MAP } from "./exercises";
import type { Workout, WorkoutEntry } from "./types";
import { uid } from "./store";

const H = 3_600_000;

function entry(exerciseId: string, sets: number, reps: number, load: number, rpe: number): WorkoutEntry {
  const ex = EXERCISE_MAP[exerciseId];
  if (!ex) throw new Error(`Exercício desconhecido: ${exerciseId}`);
  return { id: uid(), exerciseId, muscle: ex.muscle, secondary: ex.secondary, sets, reps, load, rpe };
}

/** Two weeks of a push/pull/legs routine ending ~20 h ago. */
export function sampleWorkouts(now = Date.now()): Workout[] {
  const push = (k: number): WorkoutEntry[] => [
    entry("supino-reto-com-barra", 4, 8, 70 + k * 2.5, 8),
    entry("supino-inclinado-com-halteres", 3, 10, 26 + k, 8),
    entry("elevacao-lateral-com-halteres", 4, 14, 10, 9),
    entry("triceps-corda", 3, 12, 25 + k, 8),
  ];
  const pull = (k: number): WorkoutEntry[] => [
    entry("barra-fixa-pronada", 4, 8, 0, 8),
    entry("remada-curvada-com-barra", 4, 8, 60 + k * 2.5, 8),
    entry("face-pull", 3, 15, 20, 7),
    entry("rosca-direta-com-barra", 3, 10, 30 + k, 9),
  ];
  const legs = (k: number): WorkoutEntry[] => [
    entry("agachamento-livre-back-squat", 4, 6, 90 + k * 5, 9),
    entry("levantamento-terra-romeno-rdl", 3, 8, 80 + k * 5, 8),
    entry("cadeira-extensora", 3, 12, 50 + k * 2, 8),
    entry("panturrilha-em-pe-na-maquina", 4, 12, 80, 8),
  ];
  const plan = [
    { d: 13, e: push(0) },
    { d: 12, e: pull(0) },
    { d: 11, e: legs(0) },
    { d: 9, e: push(1) },
    { d: 8, e: pull(1) },
    { d: 7, e: legs(1) },
    { d: 5, e: push(2) },
    { d: 4, e: pull(2) },
    { d: 3, e: legs(2) },
    { d: 1.8, e: push(3) },
    { d: 0.85, e: pull(3) },
  ];
  return plan.map((p) => ({
    id: uid(),
    kind: "full" as const,
    date: new Date(now - p.d * 24 * H).toISOString(),
    entries: p.e,
  }));
}
