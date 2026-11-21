import type { PlanDay, Program } from "./programs";
import { planKey } from "./programs";
import type { Workout } from "./types";

export const WEEKDAYS = [
  { value: 1, short: "Seg", label: "Segunda" },
  { value: 2, short: "Ter", label: "Terça" },
  { value: 3, short: "Qua", label: "Quarta" },
  { value: 4, short: "Qui", label: "Quinta" },
  { value: 5, short: "Sex", label: "Sexta" },
  { value: 6, short: "Sáb", label: "Sábado" },
  { value: 0, short: "Dom", label: "Domingo" },
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export function suggestedTrainingDays(frequency: number): number[] {
  const patterns: Record<number, number[]> = {
    1: [1],
    2: [1, 4],
    3: [1, 3, 5],
    4: [1, 2, 4, 6],
    5: [1, 2, 3, 5, 6],
    6: [1, 2, 3, 4, 5, 6],
    7: [1, 2, 3, 4, 5, 6, 0],
  };
  return [...(patterns[frequency] ?? patterns[3]!)];
}

export function normalizeTrainingDays(days: number[] | undefined): number[] {
  const selected = new Set(
    (days ?? []).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
  );
  return WEEKDAYS.filter(({ value }) => selected.has(value)).map(({ value }) => value);
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(key: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : undefined;
}

function utcDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

export function weekStartDate(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

export function weekStartKey(date: Date): string {
  return localDateKey(weekStartDate(date));
}

export function scheduleAnchorDate(trainingDays: number[] | undefined, now: Date): string {
  const days = normalizeTrainingDays(trainingDays);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let offset = 0; offset < 7; offset++) {
    const candidate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    if (days.includes(candidate.getDay())) return localDateKey(candidate);
  }
  return localDateKey(today);
}

export function dateInWeek(reference: Date, weekday: number): Date {
  const start = weekStartDate(reference);
  const offset = weekday === 0 ? 6 : weekday - 1;
  start.setDate(start.getDate() + offset);
  return start;
}

export function scheduledProgramDay(
  program: Program,
  trainingDays: number[] | undefined,
  scheduleStart: string,
  date: Date,
): PlanDay | undefined {
  const days = normalizeTrainingDays(trainingDays);
  const weekdayIndex = days.indexOf(date.getDay());
  if (days.length === 0 || weekdayIndex < 0 || program.days.length === 0) return undefined;

  const anchor = parseLocalDate(scheduleStart);
  if (!anchor) return undefined;
  const targetWeek = weekStartDate(date);
  const anchorWeek = weekStartDate(anchor);
  const weeksFromAnchor = Math.floor(
    ((utcDayNumber(targetWeek) - utcDayNumber(anchorWeek)) * DAY_MS) / WEEK_MS,
  );
  if (weeksFromAnchor < 0) return undefined;

  const anchorDayIndex = days.indexOf(anchor.getDay());
  const rotationPosition = weeksFromAnchor * days.length + weekdayIndex - anchorDayIndex;
  if (rotationPosition < 0) return undefined;
  const rotationIndex = rotationPosition % program.days.length;
  return program.days[rotationIndex];
}

export interface NextScheduledWorkout {
  day: PlanDay;
  date: Date;
  daysAway: number;
}

export function nextScheduledWorkout(
  program: Program,
  trainingDays: number[] | undefined,
  scheduleStart: string,
  workouts: Workout[],
  now: number,
): NextScheduledWorkout | undefined {
  if (normalizeTrainingDays(trainingDays).length === 0) return undefined;

  const today = new Date(now);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayNumber = utcDayNumber(todayStart);

  // A selected weekday always occurs within seven days; the longer horizon handles
  // skipped sessions that were already logged for the scheduled date.
  for (let daysAway = 0; daysAway < 35; daysAway++) {
    const date = new Date(
      todayStart.getFullYear(),
      todayStart.getMonth(),
      todayStart.getDate() + daysAway,
    );
    const day = scheduledProgramDay(program, trainingDays, scheduleStart, date);
    if (!day) continue;

    const key = planKey(program, day);
    const alreadyLogged = workouts.some(
      (workout) =>
        workout.planId === key &&
        Number.isFinite(new Date(workout.date).getTime()) &&
        localDateKey(new Date(workout.date)) === localDateKey(date),
    );
    if (!alreadyLogged) return { day, date, daysAway: utcDayNumber(date) - todayNumber };
  }

  return undefined;
}
