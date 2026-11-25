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
): CardioCue[] {
  const cues: CardioCue[] = [];
  const add = (minute: number, message: string) => {
    if (minute > 0 && minute < durationMinutes)
      cues.push({ id: `auto-${activity}-${minute}`, minute, message });
  };

  if (activity === "HIIT") {
    add(1, "Aqueça: ritmo leve");
    for (let minute = 5; minute < durationMinutes - 1; minute += 3) {
      add(minute, "Acelere forte por 1 minuto");
      add(minute + 1, "Recupere: ritmo bem mais leve");
    }
    add(Math.max(2, durationMinutes - 2), "Desacelere e prepare a volta à calma");
  } else if (activity === "Corda" || activity === "Escada") {
    add(2, "Acelere por 30 segundos");
    add(3, "Recupere em ritmo leve");
    for (let minute = 6; minute < durationMinutes - 1; minute += 4) {
      add(minute, "Novo bloco forte");
      add(minute + 1, "Recupere: controle a respiração");
    }
  } else if (activity === "Corrida" || activity === "Bicicleta" || activity === "Remo") {
    add(5, "Ajuste o ritmo: confortável e constante");
    if (durationMinutes >= 20) {
      add(Math.floor(durationMinutes / 2), "Bloco moderado: acelere um pouco");
      add(Math.floor(durationMinutes / 2) + 2, "Volte ao ritmo confortável");
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
