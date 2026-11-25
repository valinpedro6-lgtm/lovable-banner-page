import type { MuscleId } from "./muscles";

export type CardioActivity =
  | "Corrida"
  | "Bicicleta"
  | "Caminhada"
  | "Caminhada inclinada"
  | "Elíptico"
  | "Remo"
  | "Corda"
  | "Escada"
  | "Natação"
  | "Dança"
  | "HIIT";

export interface WorkoutEntry {
  id: string;
  /** Exercise id from the library; absent for quick workouts. */
  exerciseId?: string;
  muscle: MuscleId;
  secondary: MuscleId[];
  sets: number;
  reps: number;
  load: number;
  rpe: number;
}

export interface Workout {
  id: string;
  date: string;
  kind: "full" | "quick";
  /** "programId.dayId" when started from a ready-made workout. */
  planId?: string;
  /** Cardio completed during this session. It does not add muscle-recovery stimulus. */
  cardio?: { activity: CardioActivity; durationSeconds: number };
  entries: WorkoutEntry[];
}

export type Soreness = 0 | 1 | 2 | 3;
export interface CheckIn {
  id: string;
  date: string;
  /** 1 (descansado) – 5 (exausto) */
  fatigue: number;
  /** 1 (sem energia) – 5 (muita disposição) */
  energy: number;
  soreness: Partial<Record<MuscleId, Soreness>>;
}

export type Experience = "iniciante" | "intermediario" | "avancado";
export type BodyGoal = "manter" | "emagrecer" | "ganhar_massa" | "ganhar_peso";
export type ActivityLevel = "sedentario" | "leve" | "moderado" | "alto";
export type CalculationSex = "masculino" | "feminino" | null;

export interface BodyMeasurements {
  armCm: number | null;
  waistCm: number | null;
  chestCm: number | null;
  hipCm: number | null;
}

export interface WeightLog {
  date: string;
  weight: number;
}

export interface Profile {
  name: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  experience: Experience;
  weeklyFrequency: number;
  split: string;
  setupComplete?: boolean;
  goal?: BodyGoal;
  targetWeight?: number | null;
  goalStartWeight?: number | null;
  activityLevel?: ActivityLevel;
  calculationSex?: CalculationSex;
  waterGoalMl?: number;
  measurements?: BodyMeasurements;
  /** JavaScript weekday numbers: Sunday = 0, Monday = 1, ... */
  trainingDays?: number[];
  /** Local YYYY-MM-DD for the first active day of the current training cycle. */
  trainingScheduleStart?: string | null;
  /** Optional user labels for the weekly training map, keyed by JS weekday (0–6). */
  weeklyPlan?: Record<string, string>;
}

export interface NotificationPrefs {
  reminder: boolean;
  reminderTime: string;
  recovery: boolean;
  overload: boolean;
  weekly: boolean;
}
