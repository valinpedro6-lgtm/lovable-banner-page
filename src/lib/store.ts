import { useSyncExternalStore } from "react";
import type { Exercise } from "./exercises";
import type { CheckIn, NotificationPrefs, Profile, WeightLog, Workout } from "./types";

export interface AppState {
  workouts: Workout[];
  checkIns: CheckIn[];
  profile: Profile;
  notifications: NotificationPrefs;
  customExercises: Exercise[];
  weightHistory: WeightLog[];
  waterIntake: Record<string, number>;
}

const KEY = "muscle-recovery:v1";
const emptyMeasurements = { armCm: null, waistCm: null, chestCm: null, hipCm: null };

export const DEFAULT_STATE: AppState = {
  workouts: [],
  checkIns: [],
  profile: {
    name: "",
    age: null,
    weight: null,
    height: null,
    experience: "intermediario",
    weeklyFrequency: 3,
    split: "ppl",
    setupComplete: false,
    goal: "manter",
    targetWeight: null,
    goalStartWeight: null,
    activityLevel: "leve",
    calculationSex: null,
    waterGoalMl: 2500,
    measurements: emptyMeasurements,
    trainingDays: [1, 3, 5],
    trainingScheduleStart: null,
  },
  notifications: {
    reminder: false,
    reminderTime: "18:00",
    recovery: true,
    overload: true,
    weekly: false,
  },
  customExercises: [],
  weightHistory: [],
  waterIntake: {},
};

let state: AppState = DEFAULT_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function upsertWeightLog(history: WeightLog[], weight: number): WeightLog[] {
  const date = localDateKey();
  const existing = history.findIndex((entry) => entry.date === date);
  if (existing >= 0) {
    const next = [...history];
    next[existing] = { date, weight };
    return next;
  }
  return [...history, { date, weight }].slice(-365);
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      state = {
        ...DEFAULT_STATE,
        ...parsed,
        profile: {
          ...DEFAULT_STATE.profile,
          ...parsed.profile,
          measurements: { ...emptyMeasurements, ...parsed.profile?.measurements },
        },
        notifications: { ...DEFAULT_STATE.notifications, ...parsed.notifications },
        weightHistory: Array.isArray(parsed.weightHistory) ? parsed.weightHistory : [],
        waterIntake:
          parsed.waterIntake && typeof parsed.waterIntake === "object" ? parsed.waterIntake : {},
      };
    }
  } catch {
    state = DEFAULT_STATE;
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked */
  }
}

export function setState(updater: (s: AppState) => AppState) {
  load();
  state = updater(state);
  persist();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      loaded = false;
      load();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return state;
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_STATE);
}

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const actions = {
  addWorkout(workout: Workout) {
    setState((current) => ({ ...current, workouts: [...current.workouts, workout] }));
  },
  deleteWorkout(id: string) {
    setState((current) => ({
      ...current,
      workouts: current.workouts.filter((workout) => workout.id !== id),
    }));
  },
  addCheckIn(checkIn: CheckIn) {
    setState((current) => ({ ...current, checkIns: [...current.checkIns, checkIn].slice(-120) }));
  },
  updateProfile(patch: Partial<Profile>) {
    setState((current) => {
      const profile = { ...current.profile, ...patch };
      const weight = profile.weight;
      const isValidWeight = typeof weight === "number" && weight >= 30 && weight <= 300;
      const weightChanged = isValidWeight && weight !== current.profile.weight;
      const needsInitialBaseline =
        isValidWeight && patch.setupComplete === true && current.weightHistory.length === 0;
      return {
        ...current,
        profile,
        weightHistory:
          weightChanged || needsInitialBaseline
            ? upsertWeightLog(current.weightHistory, weight as number)
            : current.weightHistory,
      };
    });
  },
  addWater(amountMl: number) {
    if (!Number.isFinite(amountMl)) return;
    const date = localDateKey();
    setState((current) => ({
      ...current,
      waterIntake: {
        ...current.waterIntake,
        [date]: Math.max(0, Math.min(20_000, (current.waterIntake[date] ?? 0) + amountMl)),
      },
    }));
  },
  updateNotifications(patch: Partial<NotificationPrefs>) {
    setState((current) => ({ ...current, notifications: { ...current.notifications, ...patch } }));
  },
  addCustomExercise(exercise: Exercise) {
    setState((current) => ({
      ...current,
      customExercises: [...current.customExercises, exercise],
    }));
  },
  removeCustomExercise(id: string) {
    setState((current) => ({
      ...current,
      customExercises: current.customExercises.filter((exercise) => exercise.id !== id),
    }));
  },
  reset() {
    setState(() => DEFAULT_STATE);
  },
  replaceAll(next: AppState) {
    setState(() => ({
      ...DEFAULT_STATE,
      ...next,
      profile: {
        ...DEFAULT_STATE.profile,
        ...next.profile,
        measurements: { ...emptyMeasurements, ...next.profile?.measurements },
      },
      notifications: { ...DEFAULT_STATE.notifications, ...next.notifications },
      weightHistory: Array.isArray(next.weightHistory) ? next.weightHistory : [],
      waterIntake: next.waterIntake ?? {},
    }));
  },
};
