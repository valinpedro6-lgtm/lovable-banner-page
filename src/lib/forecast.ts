import { MUSCLE_IDS, type MuscleId } from "./muscles";
import { recoveryAt, stimuliFrom, type EngineInput } from "./recovery";

export interface ForecastPoint {
  h: number;
  pct: number;
  label: string;
}

/** Projected recovery (one muscle, or the average of all) for the next `hours`, assuming no new training. */
export function forecast(
  input: EngineInput,
  now: number,
  opts: { hours?: number; step?: number; muscle?: MuscleId } = {},
): ForecastPoint[] {
  const { hours = 72, step = 3, muscle } = opts;
  const stimuli = stimuliFrom(input.workouts);
  const ids: readonly MuscleId[] = muscle ? [muscle] : MUSCLE_IDS;
  const out: ForecastPoint[] = [];
  for (let h = 0; h <= hours; h += step) {
    const t = now + h * 3_600_000;
    const pct = Math.round(ids.reduce((a, m) => a + recoveryAt(m, input, t, stimuli), 0) / ids.length);
    out.push({ h, pct, label: h === 0 ? "agora" : `+${h}h` });
  }
  return out;
}
