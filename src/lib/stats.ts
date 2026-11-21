import type { MuscleId } from "./muscles";
import type { Workout } from "./types";
import { workoutSets, workoutVolume } from "./workout-utils";

export function dayStart(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Monday 00:00 of the week containing `t` (local time). */
export function weekStart(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

export function addDays(t: number, n: number): number {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

const past = (workouts: Workout[], now: number) =>
  workouts.filter((w) => new Date(w.date).getTime() <= now);

export interface WeekBucket {
  start: number;
  label: string;
  sets: number;
  volume: number;
  sessions: number;
  current: boolean;
}

export function weeklyBuckets(workouts: Workout[], now: number, weeks = 8): WeekBucket[] {
  const current = weekStart(now);
  const buckets: WeekBucket[] = Array.from({ length: weeks }, (_, i) => {
    const start = addDays(current, -7 * (weeks - 1 - i));
    return {
      start,
      label: new Date(start).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      sets: 0,
      volume: 0,
      sessions: 0,
      current: start === current,
    };
  });
  for (const w of past(workouts, now)) {
    const b = buckets.find((x) => x.start === weekStart(new Date(w.date).getTime()));
    if (!b) continue;
    b.sessions++;
    b.sets += workoutSets(w);
    b.volume += workoutVolume(w);
  }
  return buckets;
}

/** Total sets per local day (keyed by day start). */
export function setsByDay(workouts: Workout[], now: number): Map<number, number> {
  const map = new Map<number, number>();
  for (const w of past(workouts, now)) {
    const k = dayStart(new Date(w.date).getTime());
    map.set(k, (map.get(k) ?? 0) + workoutSets(w));
  }
  return map;
}

/** Consecutive weeks with at least one workout. The current week counts once trained; until then the streak runs from last week. */
export function weekStreak(workouts: Workout[], now: number): number {
  const weeks = new Set(past(workouts, now).map((w) => weekStart(new Date(w.date).getTime())));
  let cur = weekStart(now);
  if (!weeks.has(cur)) cur = addDays(cur, -7);
  let n = 0;
  while (weeks.has(cur)) {
    n++;
    cur = addDays(cur, -7);
  }
  return n;
}

/** Sets per muscle since `since`: primary 1×, secondary 0.5×. */
export function muscleSets(workouts: Workout[], since: number, now: number): Partial<Record<MuscleId, number>> {
  const out: Partial<Record<MuscleId, number>> = {};
  for (const w of past(workouts, now)) {
    if (new Date(w.date).getTime() < since) continue;
    for (const e of w.entries) {
      out[e.muscle] = (out[e.muscle] ?? 0) + e.sets;
      for (const s of e.secondary) if (s !== e.muscle) out[s] = (out[s] ?? 0) + e.sets * 0.5;
    }
  }
  return out;
}

/** Estimated one-rep max (Epley). */
export function e1rm(load: number, reps: number): number {
  if (load <= 0) return 0;
  if (reps <= 1) return load;
  return Math.round(load * (1 + reps / 30) * 10) / 10;
}

export interface ExerciseLog {
  workoutId: string;
  date: string;
  sets: number;
  reps: number;
  load: number;
  rpe: number;
  e1rm: number;
}

export function exerciseLogs(workouts: Workout[], exerciseId: string): ExerciseLog[] {
  const out: ExerciseLog[] = [];
  for (const w of workouts) {
    for (const e of w.entries) {
      if (e.exerciseId !== exerciseId) continue;
      out.push({
        workoutId: w.id,
        date: w.date,
        sets: e.sets,
        reps: e.reps,
        load: e.load,
        rpe: e.rpe,
        e1rm: e1rm(e.load, e.reps),
      });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function exerciseUsage(workouts: Workout[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const w of workouts)
    for (const e of w.entries) if (e.exerciseId) map.set(e.exerciseId, (map.get(e.exerciseId) ?? 0) + 1);
  return map;
}

export function fmtSets(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}

export function fmtVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace(".", ",")} t`;
  return `${Math.round(kg)} kg`;
}

/** Uppercases only the first character ("qui., 19 de nov." → "Qui., 19 de nov."). */
export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
