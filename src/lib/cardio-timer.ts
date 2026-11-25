import type { CardioActivity } from "./types";

export const CARDIO_ACTIVITY_OPTIONS: { value: CardioActivity; label: string }[] = [
  { value: "Corrida", label: "Corrida" },
  { value: "Bicicleta", label: "Bicicleta" },
  { value: "Caminhada", label: "Caminhada" },
  { value: "Caminhada inclinada", label: "Caminhada inclinada" },
  { value: "Elíptico", label: "Elíptico" },
  { value: "Remo", label: "Remo" },
  { value: "Corda", label: "Corda" },
  { value: "Escada", label: "Escada" },
  { value: "Natação", label: "Natação" },
  { value: "Dança", label: "Dança" },
  { value: "HIIT", label: "HIIT" },
];

export interface CardioCue {
  id: string;
  minute: number;
  message: string;
}

export type CardioIntensity = "muito-intenso" | "intenso" | "moderado" | "leve" | "variado";

export const CARDIO_INTENSITY_OPTIONS: { value: CardioIntensity; label: string; hint: string }[] = [
  { value: "muito-intenso", label: "Muito intenso", hint: "blocos curtos e fortes" },
  { value: "intenso", label: "Intenso", hint: "esforço alto com pausas" },
  { value: "moderado", label: "Moderado", hint: "ritmo sustentável" },
  { value: "leve", label: "Leve", hint: "mais recuperação" },
  { value: "variado", label: "Variado", hint: "mistura de blocos" },
];

export const CARDIO_DEFAULT_MINUTES: Record<CardioActivity, number> = {
  Corrida: 25,
  Bicicleta: 30,
  Caminhada: 35,
  "Caminhada inclinada": 25,
  Elíptico: 25,
  Remo: 20,
  Corda: 12,
  Escada: 15,
  Natação: 30,
  Dança: 30,
  HIIT: 40,
};

/** Builds practical interval cues for activities that alternate effort and recovery. */
export function automaticCardioCues(
  activity: CardioActivity,
  durationMinutes: number,
  intensity: CardioIntensity = "variado",
): CardioCue[] {
  const cues: CardioCue[] = [];
  const add = (minute: number, message: string) => {
    if (minute <= 0 || minute >= durationMinutes) return;
    const existing = cues.find((cue) => cue.minute === minute);
    if (existing) {
      existing.message = message;
      return;
    }
    cues.push({ id: `auto-${activity}-${minute}`, minute, message });
  };

  const blocks: Record<Exclude<CardioIntensity, "variado">, [number, number]> = {
    "muito-intenso": [1, 1],
    intenso: [3, 2],
    moderado: [5, 3],
    leve: [5, 5],
  };
  const [effortMinutes, recoveryMinutes] = intensity === "variado" ? [0, 0] : blocks[intensity];

  if (activity === "HIIT") {
    add(1, "Aqueça: ritmo leve");
    let minute = 5;
    let cycle = 0;
    while (minute < durationMinutes - 1) {
      const variedEffort = [2, 3, 5, 3, 2][cycle % 5];
      const effort = intensity === "variado" ? variedEffort : effortMinutes;
      const recovery = intensity === "variado" ? (cycle % 2 === 0 ? 2 : 3) : recoveryMinutes;
      add(minute, `Acelere forte por ${effort} ${effort === 1 ? "minuto" : "minutos"}`);
      minute += effort;
      add(minute, `Recupere por ${recovery} ${recovery === 1 ? "minuto" : "minutos"}`);
      minute += recovery;
      cycle += 1;
    }
    if (intensity === "variado" && durationMinutes > 20) {
      add(20, "Acelere forte: bloco de referência");
    }
    add(Math.max(2, durationMinutes - 2), "Desacelere e prepare a volta à calma");
  } else if (activity === "Corda" || activity === "Escada") {
    const effort = intensity === "variado" ? 2 : Math.max(1, effortMinutes);
    const recovery = intensity === "variado" ? 2 : Math.max(1, recoveryMinutes);
    let minute = 2;
    while (minute < durationMinutes - 1) {
      add(minute, `Acelere por ${effort} ${effort === 1 ? "minuto" : "minutos"}`);
      minute += effort;
      add(minute, `Recupere por ${recovery} ${recovery === 1 ? "minuto" : "minutos"}`);
      minute += recovery;
    }
  } else if (activity === "Corrida" || activity === "Bicicleta" || activity === "Remo") {
    add(5, "Ajuste o ritmo: confortável e constante");
    if (durationMinutes >= 20) {
      const midpoint = Math.floor(durationMinutes / 2);
      const effort = intensity === "variado" ? 5 : Math.max(1, effortMinutes);
      add(
        midpoint,
        `Bloco ${intensity === "leve" ? "leve" : "forte"}: mantenha por ${effort} minutos`,
      );
      add(midpoint + effort, "Volte ao ritmo confortável");
    }
  }
  return cues.sort((a, b) => a.minute - b.minute);
}

export interface CardioPreset {
  activity: CardioActivity;
  minutes: number;
  nonce: number;
}

export interface CardioReminder {
  id: string;
  minute: number;
  message: string;
}

export function parseCardioPreset(search: Record<string, unknown>): CardioPreset | undefined {
  const activity = CARDIO_ACTIVITY_OPTIONS.find(
    (option) => option.value === search["activity"],
  )?.value;
  const rawMinutes = search["minutes"];
  const minutes = typeof rawMinutes === "number" ? rawMinutes : Number(rawMinutes);
  const rawNonce = search["nonce"];
  const nonce = typeof rawNonce === "number" ? rawNonce : Number(rawNonce);

  if (!activity || !Number.isInteger(minutes) || minutes < 1 || minutes > 180) return undefined;

  return {
    activity,
    minutes,
    nonce: Number.isSafeInteger(nonce) && nonce >= 0 ? nonce : 0,
  };
}

export function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function remindersCrossed(
  previousSeconds: number,
  currentSeconds: number,
  reminders: CardioReminder[],
  firedIds: Set<string>,
): CardioReminder[] {
  return reminders.filter(
    (reminder) =>
      !firedIds.has(reminder.id) &&
      reminder.minute * 60 > previousSeconds &&
      reminder.minute * 60 <= currentSeconds,
  );
}
