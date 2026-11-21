import type { MuscleId } from "./muscles";

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
  date: string; // ISO
  kind: "full" | "quick";
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

export interface Profile {
  name: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  experience: Experience;
  weeklyFrequency: number;
  split: string;
}

export interface NotificationPrefs {
  reminder: boolean;
  reminderTime: string;
  recovery: boolean;
  overload: boolean;
  weekly: boolean;
}
