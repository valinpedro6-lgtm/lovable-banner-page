import type { CardioActivity } from "./types";

export const CARDIO_ACTIVITY_OPTIONS: { value: CardioActivity; label: string }[] = [
  { value: "Corrida", label: "Corrida" },
  { value: "Bicicleta", label: "Bicicleta" },
  { value: "Caminhada inclinada", label: "Caminhada inclinada" },
  { value: "Elíptico", label: "Elíptico" },
  { value: "Remo", label: "Remo" },
  { value: "Corda", label: "Corda" },
  { value: "Escada", label: "Escada" },
];

export interface CardioReminder {
  id: string;
  minute: number;
  message: string;
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
