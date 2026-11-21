import { useSyncExternalStore } from "react";
import type { Exercise } from "./exercises";
import type { CheckIn, NotificationPrefs, Profile, Workout } from "./types";

export interface AppState {
  workouts: Workout[];
  checkIns: CheckIn[];
  profile: Profile;
  notifications: NotificationPrefs;
  customExercises: Exercise[];
}

const KEY = "muscle-recovery:v1";

export const DEFAULT_STATE: AppState = {
  workouts: [],
  checkIns: [],
  profile: {
    name: "",
    age: null,
    weight: null,
    height: null,
    experience: "intermediario",
    weeklyFrequency: 4,
    split: "ppl",
  },
  notifications: {
    reminder: false,
    reminderTime: "18:00",
    recovery: true,
    overload: true,
    weekly: false,
  },
  customExercises: [],
};

let state: AppState = DEFAULT_STATE;
let loaded = false;
const listeners = new Set<() => void>();

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
        profile: { ...DEFAULT_STATE.profile, ...parsed.profile },
        notifications: { ...DEFAULT_STATE.notifications, ...parsed.notifications },
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
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
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
  addWorkout(w: Workout) {
    setState((s) => ({ ...s, workouts: [...s.workouts, w] }));
  },
  deleteWorkout(id: string) {
    setState((s) => ({ ...s, workouts: s.workouts.filter((w) => w.id !== id) }));
  },
  addCheckIn(c: CheckIn) {
    setState((s) => ({ ...s, checkIns: [...s.checkIns, c].slice(-120) }));
  },
  updateProfile(p: Partial<Profile>) {
    setState((s) => ({ ...s, profile: { ...s.profile, ...p } }));
  },
  updateNotifications(p: Partial<NotificationPrefs>) {
    setState((s) => ({ ...s, notifications: { ...s.notifications, ...p } }));
  },
  addCustomExercise(e: Exercise) {
    setState((s) => ({ ...s, customExercises: [...s.customExercises, e] }));
  },
  removeCustomExercise(id: string) {
    setState((s) => ({ ...s, customExercises: s.customExercises.filter((e) => e.id !== id) }));
  },
  reset() {
    setState(() => DEFAULT_STATE);
  },
  replaceAll(next: AppState) {
    setState(() => next);
  },
};
