export const MUSCLE_IDS = [
  "peitoral",
  "deltoides",
  "trapezio",
  "dorsais",
  "lombar",
  "biceps",
  "triceps",
  "antebracos",
  "abdomen",
  "quadriceps",
  "posteriores",
  "gluteos",
  "panturrilhas",
] as const;

export type MuscleId = (typeof MUSCLE_IDS)[number];

export interface MuscleInfo {
  id: MuscleId;
  name: string;
  short: string;
  /** Baseline hours for a moderate (~8 hard sets) session to fully recover. */
  baseHours: number;
  side: "front" | "back" | "both";
}

export const MUSCLES: Record<MuscleId, MuscleInfo> = {
  peitoral: { id: "peitoral", name: "Peitoral", short: "Peito", baseHours: 60, side: "front" },
  deltoides: { id: "deltoides", name: "Deltoides", short: "Ombro", baseHours: 54, side: "both" },
  trapezio: { id: "trapezio", name: "Trapézio", short: "Trapézio", baseHours: 54, side: "both" },
  dorsais: { id: "dorsais", name: "Dorsais", short: "Costas", baseHours: 66, side: "back" },
  lombar: { id: "lombar", name: "Lombar", short: "Lombar", baseHours: 72, side: "back" },
  biceps: { id: "biceps", name: "Bíceps", short: "Bíceps", baseHours: 48, side: "front" },
  triceps: { id: "triceps", name: "Tríceps", short: "Tríceps", baseHours: 48, side: "back" },
  antebracos: { id: "antebracos", name: "Antebraços", short: "Antebraço", baseHours: 40, side: "both" },
  abdomen: { id: "abdomen", name: "Abdômen", short: "Abdômen", baseHours: 40, side: "front" },
  quadriceps: { id: "quadriceps", name: "Quadríceps", short: "Quadríceps", baseHours: 72, side: "front" },
  posteriores: { id: "posteriores", name: "Posterior de coxa", short: "Posterior", baseHours: 72, side: "back" },
  gluteos: { id: "gluteos", name: "Glúteos", short: "Glúteos", baseHours: 66, side: "back" },
  panturrilhas: { id: "panturrilhas", name: "Panturrilhas", short: "Panturrilha", baseHours: 42, side: "both" },
};

export const MUSCLE_LIST: MuscleInfo[] = MUSCLE_IDS.map((id) => MUSCLES[id]);

export function isMuscleId(v: string): v is MuscleId {
  return (MUSCLE_IDS as readonly string[]).includes(v);
}

/** Suggested sessions used by the "Próximo treino" recommender. */
export const SPLITS: { id: string; name: string; muscles: MuscleId[] }[] = [
  { id: "push", name: "Push · Empurrar", muscles: ["peitoral", "deltoides", "triceps"] },
  { id: "pull", name: "Pull · Puxar", muscles: ["dorsais", "biceps", "trapezio", "antebracos"] },
  { id: "legs", name: "Pernas", muscles: ["quadriceps", "posteriores", "gluteos", "panturrilhas"] },
  { id: "upper", name: "Superiores", muscles: ["peitoral", "dorsais", "deltoides", "biceps", "triceps"] },
  { id: "core", name: "Core & Lombar", muscles: ["abdomen", "lombar"] },
];
