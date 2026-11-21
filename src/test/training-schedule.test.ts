import { describe, expect, it } from "vitest";
import { PROGRAMS } from "@/lib/programs";
import {
  localDateKey,
  nextScheduledWorkout,
  normalizeTrainingDays,
  scheduleAnchorDate,
  scheduledProgramDay,
} from "@/lib/training-schedule";
import type { Workout } from "@/lib/types";

const ppl = PROGRAMS.find((program) => program.id === "ppl")!;

describe("training schedule", () => {
  it("normalizes selected weekdays in Monday-first order", () => {
    expect(normalizeTrainingDays([5, 1, 5, 0, 8])).toEqual([1, 5, 0]);
  });

  it("starts the split on the next selected weekday", () => {
    expect(scheduleAnchorDate([1, 3, 5], new Date(2026, 10, 21, 12))).toBe("2026-11-23");
  });

  it("assigns sequential split sessions to scheduled weekdays", () => {
    const anchor = "2026-11-16";
    expect(scheduledProgramDay(ppl, [1, 3, 5], anchor, new Date(2026, 10, 16))?.id).toBe("push");
    expect(scheduledProgramDay(ppl, [1, 3, 5], anchor, new Date(2026, 10, 17))).toBeUndefined();
    expect(scheduledProgramDay(ppl, [1, 3, 5], anchor, new Date(2026, 10, 18))?.id).toBe("pull");
    expect(scheduledProgramDay(ppl, [1, 3, 5], anchor, new Date(2026, 10, 20))?.id).toBe("legs");
  });

  it("continues rotating a longer split across weeks when fewer days are scheduled", () => {
    const anchor = "2026-11-16";
    expect(scheduledProgramDay(ppl, [1, 4], anchor, new Date(2026, 10, 16))?.id).toBe("push");
    expect(scheduledProgramDay(ppl, [1, 4], anchor, new Date(2026, 10, 19))?.id).toBe("pull");
    expect(scheduledProgramDay(ppl, [1, 4], anchor, new Date(2026, 10, 23))?.id).toBe("legs");
    expect(scheduledProgramDay(ppl, [1, 4], anchor, new Date(2026, 10, 26))?.id).toBe("push");
  });

  it("skips a scheduled session already recorded on that local date", () => {
    const workout: Workout = {
      id: "done",
      date: new Date(2026, 10, 23, 17).toISOString(),
      kind: "full",
      planId: "ppl.push",
      entries: [],
    };
    const next = nextScheduledWorkout(
      ppl,
      [1, 3, 5],
      "2026-11-23",
      [workout],
      new Date(2026, 10, 23, 18).getTime(),
    );
    expect(next?.day.id).toBe("pull");
    expect(localDateKey(next!.date)).toBe("2026-11-25");
  });
});
