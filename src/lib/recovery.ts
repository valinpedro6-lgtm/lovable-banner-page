import { MUSCLES, MUSCLE_IDS, SPLITS, type MuscleId } from "./muscles";
import type { CheckIn, Profile, Workout } from "./types";

const HOUR = 3_600_000;

export type RecoveryBand = "low" | "mid" | "high" | "full";

/** Spec thresholds: red 0–39, orange 40–69, yellow 70–89, green 90–100. */
export function bandFor(pct: number): RecoveryBand {
  if (pct < 40) return "low";
  if (pct < 70) return "mid";
  if (pct < 90) return "high";
  return "full";
}

export const BAND_LABEL: Record<RecoveryBand, string> = {
  low: "Fadigado",
  mid: "Recuperando",
  high: "Quase pronto",
  full: "Recuperado",
};

export const BAND_COLOR: Record<RecoveryBand, string> = {
  low: "var(--rec-low)",
  mid: "var(--rec-mid)",
  high: "var(--rec-high)",
  full: "var(--rec-full)",
};

/** RPE 1–10 → intensity multiplier (RPE 10 = 1.0, RPE 7 ≈ 0.63). */
export function intensityFactor(rpe: number): number {
  const r = Math.min(10, Math.max(1, rpe));
  return Math.pow(r / 10, 1.3);
}

/** Very low reps cause slightly more tissue stress per set, very high reps a bit less. */
export function repFactor(reps: number): number {
  if (reps <= 5) return 1.05;
  if (reps <= 12) return 1;
  if (reps <= 20) return 0.92;
  return 0.85;
}

export function individualFactor(profile?: Pick<Profile, "age" | "experience"> | null): number {
  let f = 1;
  if (profile?.age) {
    if (profile.age >= 50) f *= 1.25;
    else if (profile.age >= 40) f *= 1.12;
    else if (profile.age < 25) f *= 0.95;
  }
  if (profile?.experience === "iniciante") f *= 1.1;
  if (profile?.experience === "avancado") f *= 0.92;
  return f;
}

export interface Stimulus {
  muscle: MuscleId;
  time: number; // ms
  /** Effective hard sets weighted by role, intensity and reps. */
  load: number;
  workoutId: string;
}

/** Flattens workouts into per-muscle stimuli. Primary muscle = 1×, secondary (overlap) = 0.5×. */
export function stimuliFrom(workouts: Workout[]): Stimulus[] {
  const out: Stimulus[] = [];
  for (const w of workouts) {
    const time = new Date(w.date).getTime();
    const per = new Map<MuscleId, number>();
    for (const e of w.entries) {
      const base = e.sets * intensityFactor(e.rpe) * repFactor(e.reps);
      per.set(e.muscle, (per.get(e.muscle) ?? 0) + base);
      for (const s of e.secondary) {
        if (s === e.muscle) continue;
        per.set(s, (per.get(s) ?? 0) + base * 0.5);
      }
    }
    for (const [muscle, load] of per) out.push({ muscle, time, load, workoutId: w.id });
  }
  return out.sort((a, b) => a.time - b.time);
}

/** Fatigue (0–100) a session produces right after it ends. */
export function impactFor(load: number): number {
  return 100 * (1 - Math.exp(-load / 5));
}

/**
 * Hours a session needs to fully clear. Grows with volume, so 3 easy sets and 15 brutal sets
 * do not share one fixed 48 h timer. Repeated hits within 4 days stretch it further.
 */
export function hoursFor(muscle: MuscleId, load: number, priorHits: number, indiv: number): number {
  const base = MUSCLES[muscle].baseHours;
  const volume = 0.45 + 0.55 * Math.min(load, 16) / 8;
  const frequency = 1 + 0.12 * priorHits;
  return base * volume * frequency * indiv;
}

function residual(impact: number, elapsedH: number, hours: number): number {
  if (elapsedH < 0) return 0;
  if (elapsedH >= hours) return 0;
  return impact * Math.pow(1 - elapsedH / hours, 1.6);
}

export interface EngineInput {
  workouts: Workout[];
  checkIns?: CheckIn[];
  profile?: Pick<Profile, "age" | "experience"> | null;
}

export interface MuscleState {
  muscle: MuscleId;
  pct: number;
  band: RecoveryBand;
  lastStimulus: number | null;
  /** Hours until ≥ 90 %. 0 when already there. */
  hoursToReady: number;
  /** Percentage points recovered per hour right now. */
  ratePerHour: number;
  soreness: number;
  weeklySets: number;
}

function latestCheckIn(checkIns: CheckIn[] | undefined, now: number): CheckIn | undefined {
  if (!checkIns?.length) return undefined;
  let best: CheckIn | undefined;
  for (const c of checkIns) {
    const t = new Date(c.date).getTime();
    if (t > now) continue;
    if (!best || t > new Date(best.date).getTime()) best = c;
  }
  return best;
}

const SORENESS_CAP = [100, 88, 70, 50];

/** Raw physiological estimate before subjective adjustments. */
function rawRecovery(muscle: MuscleId, stimuli: Stimulus[], now: number, indiv: number): number {
  let fatigue = 0;
  const hits = stimuli.filter((s) => s.muscle === muscle && s.time <= now);
  for (let i = 0; i < hits.length; i++) {
    const s = hits[i];
    if (!s) continue;
    let prior = 0;
    for (let j = 0; j < i; j++) {
      const p = hits[j];
      if (p && s.time - p.time <= 96 * HOUR) prior++;
    }
    const hours = hoursFor(muscle, s.load, prior, indiv);
    fatigue += residual(impactFor(s.load), (now - s.time) / HOUR, hours);
  }
  return Math.max(0, Math.min(100, 100 - fatigue));
}

export function recoveryAt(
  muscle: MuscleId,
  input: EngineInput,
  now: number,
  stimuli = stimuliFrom(input.workouts),
): number {
  const indiv = individualFactor(input.profile);
  let pct = rawRecovery(muscle, stimuli, now, indiv);
  const ci = latestCheckIn(input.checkIns, now);
  if (ci) {
    const ageH = (now - new Date(ci.date).getTime()) / HOUR;
    if (ageH <= 36) {
      const sore = ci.soreness[muscle] ?? 0;
      pct = Math.min(pct, SORENESS_CAP[sore] ?? 100);
      // Global fatigue (1–5) shaves up to 12 points, fading over 36 h.
      const fade = 1 - ageH / 36;
      pct -= Math.max(0, ci.fatigue - 2) * 4 * fade;
    }
  }
  return Math.round(Math.max(0, Math.min(100, pct)));
}

export function muscleStates(input: EngineInput, now: number): MuscleState[] {
  const stimuli = stimuliFrom(input.workouts);
  const ci = latestCheckIn(input.checkIns, now);
  const ciFresh = ci && now - new Date(ci.date).getTime() <= 36 * HOUR;
  return MUSCLE_IDS.map((muscle) => {
    const pct = recoveryAt(muscle, input, now, stimuli);
    const mine = stimuli.filter((s) => s.muscle === muscle && s.time <= now);
    const last = mine.length ? (mine[mine.length - 1]?.time ?? null) : null;
    const in1h = recoveryAt(muscle, input, now + HOUR, stimuli);
    let hoursToReady = 0;
    if (pct < 90) {
      hoursToReady = 240;
      for (let h = 1; h <= 240; h++) {
        if (rawRecovery(muscle, stimuli, now + h * HOUR, individualFactor(input.profile)) >= 90) {
          hoursToReady = h;
          break;
        }
      }
    }
    const weeklySets = input.workouts
      .filter((w) => {
        const t = new Date(w.date).getTime();
        return t <= now && now - t <= 7 * 24 * HOUR;
      })
      .reduce(
        (acc, w) =>
          acc +
          w.entries.reduce(
            (a, e) =>
              a + (e.muscle === muscle ? e.sets : e.secondary.includes(muscle) ? e.sets * 0.5 : 0),
            0,
          ),
        0,
      );
    return {
      muscle,
      pct,
      band: bandFor(pct),
      lastStimulus: last,
      hoursToReady,
      ratePerHour: Math.max(0, in1h - pct),
      soreness: ciFresh ? (ci?.soreness[muscle] ?? 0) : 0,
      weeklySets,
    };
  });
}

export function overallRecovery(states: MuscleState[]): number {
  if (!states.length) return 100;
  return Math.round(states.reduce((a, s) => a + s.pct, 0) / states.length);
}

export interface Recommendation {
  kind: "train" | "rest";
  title: string;
  muscles: MuscleId[];
  reason: string;
  readiness: number;
}

/**
 * Picks the session whose muscles are most ready. Being at 100 % is not enough: soreness,
 * recent stimulus, weekly volume and the athlete's own fatigue/energy all weigh in.
 */
export function recommend(input: EngineInput, now: number): Recommendation {
  const states = muscleStates(input, now);
  const byId = Object.fromEntries(states.map((s) => [s.muscle, s])) as Record<MuscleId, MuscleState>;
  const ci = latestCheckIn(input.checkIns, now);
  const fresh = ci && now - new Date(ci.date).getTime() <= 36 * HOUR;

  if (fresh && ci && (ci.fatigue >= 5 || (ci.fatigue >= 4 && ci.energy <= 2))) {
    return {
      kind: "rest",
      title: "Descanso ativo",
      muscles: [],
      reason: "Você relatou fadiga alta e pouca disposição. Caminhada leve, mobilidade e sono hoje.",
      readiness: 0,
    };
  }

  const score = (m: MuscleId) => {
    const s = byId[m];
    let v = s.pct - s.soreness * 15;
    if (s.lastStimulus && now - s.lastStimulus < 36 * HOUR) v -= 25;
    if (s.weeklySets > 18) v -= 15;
    if (s.lastStimulus === null || now - s.lastStimulus > 5 * 24 * HOUR) v += 6;
    if (fresh && ci) v += (ci.energy - 3) * 3;
    return v;
  };

  let best = SPLITS[0]!;
  let bestScore = -Infinity;
  for (const split of SPLITS) {
    const avg = split.muscles.reduce((a, m) => a + score(m), 0) / split.muscles.length;
    if (avg > bestScore) {
      bestScore = avg;
      best = split;
    }
  }

  const ready = best.muscles.filter((m) => byId[m].pct >= 80 && byId[m].soreness <= 1);
  if (bestScore < 60 || ready.length === 0) {
    return {
      kind: "rest",
      title: "Recuperação",
      muscles: [],
      reason: "A maioria dos grupos ainda está se recuperando. Um dia leve rende mais amanhã.",
      readiness: Math.max(0, Math.round(bestScore)),
    };
  }
  const reasons: string[] = [];
  const neglected = best.muscles.filter(
    (m) => byId[m].lastStimulus === null || now - (byId[m].lastStimulus ?? 0) > 5 * 24 * HOUR,
  );
  if (neglected.length) reasons.push("há grupos sem estímulo há dias");
  reasons.push(`prontidão média de ${Math.min(100, Math.round(bestScore))}%`);
  return {
    kind: "train",
    title: best.name,
    muscles: ready,
    reason: reasons.join(" · "),
    readiness: Math.min(100, Math.round(bestScore)),
  };
}
