import { useMemo } from "react";
import { EXERCISES, type Exercise } from "@/lib/exercises";
import { muscleStates, overallRecovery, recommend } from "@/lib/recovery";
import { useAppState } from "@/lib/store";
import { useNow } from "./use-hydrated";

export function useEngine() {
  const app = useAppState();
  const now = useNow();
  return useMemo(() => {
    const input = { workouts: app.workouts, checkIns: app.checkIns, profile: app.profile };
    const states = muscleStates(input, now);
    const sorted = [...app.workouts].sort((a, b) => b.date.localeCompare(a.date));
    const latestCheckIn = [...app.checkIns].sort((a, b) => b.date.localeCompare(a.date))[0];
    return {
      app,
      now,
      input,
      states,
      overall: overallRecovery(states),
      recommendation: recommend(input, now),
      workouts: sorted,
      lastWorkout: sorted.find((w) => new Date(w.date).getTime() <= now),
      latestCheckIn,
    };
  }, [app, now]);
}

export function useAllExercises(): Exercise[] {
  const app = useAppState();
  return useMemo(() => [...EXERCISES, ...app.customExercises], [app.customExercises]);
}
