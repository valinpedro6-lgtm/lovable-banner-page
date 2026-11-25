import { describe, expect, it } from "vitest";
import {
  automaticCardioCues,
  CARDIO_DEFAULT_MINUTES,
  formatTimer,
  parseCardioPreset,
  remindersCrossed,
  type CardioReminder,
} from "@/lib/cardio-timer";
import type { Workout } from "@/lib/types";
import { workoutTitle } from "@/lib/workout-utils";

const reminders: CardioReminder[] = [
  { id: "water", minute: 12, message: "Beber água" },
  { id: "pace", minute: 30, message: "Ajustar ritmo" },
];

describe("cardio timer helpers", () => {
  it("formats elapsed and long countdowns as mm:ss", () => {
    expect(formatTimer(0)).toBe("00:00");
    expect(formatTimer(12 * 60 + 7)).toBe("12:07");
    expect(formatTimer(45 * 60)).toBe("45:00");
    expect(formatTimer(-4)).toBe("00:00");
  });

  it("parses valid hybrid cardio presets and rejects invalid search values", () => {
    expect(parseCardioPreset({ activity: "Bicicleta", minutes: "20", nonce: "42" })).toEqual({
      activity: "Bicicleta",
      minutes: 20,
      nonce: 42,
    });
    expect(parseCardioPreset({ activity: "Flying", minutes: 20 })).toBeUndefined();
    expect(parseCardioPreset({ activity: "Corrida", minutes: 181 })).toBeUndefined();
  });

  it("configures HIIT for 40 minutes with alternating effort and recovery cues", () => {
    const cues = automaticCardioCues("HIIT", CARDIO_DEFAULT_MINUTES.HIIT);
    expect(CARDIO_DEFAULT_MINUTES.HIIT).toBe(40);
    expect(cues.some((cue) => cue.minute === 20 && cue.message.includes("Acelere"))).toBe(true);
    expect(cues.some((cue) => cue.message.includes("Recupere"))).toBe(true);
    expect(cues.every((cue) => cue.minute < 40)).toBe(true);
  });

  it("uses five-minute effort blocks when the preference is moderate", () => {
    const cues = automaticCardioCues("HIIT", 40, "moderado");
    expect(cues.some((cue) => cue.message.includes("5 minutos"))).toBe(true);
    expect(cues.some((cue) => cue.message.includes("Recupere por 3 minutos"))).toBe(true);
  });

  it("returns only reminders crossed during a tick, including long background ticks", () => {
    expect(remindersCrossed(11 * 60 + 58, 12 * 60 + 2, reminders, new Set())).toEqual([
      reminders[0],
    ]);
    expect(remindersCrossed(10 * 60, 31 * 60, reminders, new Set())).toEqual(reminders);
  });

  it("does not return reminders that already fired or are still ahead", () => {
    expect(remindersCrossed(12 * 60, 15 * 60, reminders, new Set(["water"]))).toEqual([]);
  });

  it("labels cardio-only sessions correctly in history", () => {
    const workout: Workout = {
      id: "cardio-1",
      date: new Date(0).toISOString(),
      kind: "quick",
      entries: [],
      cardio: { activity: "Corrida", durationSeconds: 12 * 60 },
    };
    expect(workoutTitle(workout)).toBe("Cardio · Corrida");
  });
});
