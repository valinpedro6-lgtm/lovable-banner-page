import { describe, expect, it } from "vitest";
import { addDays, e1rm, weekStart, weekStreak } from "@/lib/stats";
import type { Workout } from "@/lib/types";

const w = (t: number): Workout => ({ id: String(t), date: new Date(t).toISOString(), kind: "quick", entries: [] });

describe("stats", () => {
  // Wednesday noon, local time
  const now = new Date(2026, 10, 18, 12).getTime();

  it("counts consecutive training weeks including the current one", () => {
    const thisWeek = weekStart(now) + 3_600_000;
    expect(weekStreak([w(thisWeek), w(addDays(thisWeek, -7)), w(addDays(thisWeek, -14))], now)).toBe(3);
  });

  it("keeps last week's streak alive before training this week", () => {
    const lastWeek = addDays(weekStart(now), -5);
    expect(weekStreak([w(lastWeek)], now)).toBe(1);
  });

  it("breaks the streak after a week without training", () => {
    const twoWeeksAgo = addDays(weekStart(now), -12);
    expect(weekStreak([w(twoWeeksAgo)], now)).toBe(0);
  });

  it("estimates 1RM with Epley", () => {
    expect(e1rm(100, 10)).toBe(133.3);
    expect(e1rm(80, 1)).toBe(80);
    expect(e1rm(0, 12)).toBe(0);
  });
});
