import { describe, expect, it } from "vitest";
import { MUSCLE_IDS } from "@/lib/muscles";
import { adjustSets, bestDay, exerciseFor, parsePlan, programFor, PROGRAMS, rankDays } from "@/lib/programs";
import type { MuscleState } from "@/lib/recovery";

const state = (muscle: (typeof MUSCLE_IDS)[number], pct: number): MuscleState => ({
  muscle,
  pct,
  band: "full",
  lastStimulus: null,
  hoursToReady: 0,
  ratePerHour: 0,
  soreness: 0,
  weeklySets: 0,
});

describe("programs", () => {
  it("every planned exercise exists in the library", () => {
    const missing = PROGRAMS.flatMap((p) => p.days.flatMap((d) => d.items.map(([n]) => n))).filter(
      (n) => !exerciseFor(n),
    );
    expect(missing).toEqual([]);
  });

  it("offers more than the original six splits", () => {
    expect(PROGRAMS.length).toBeGreaterThanOrEqual(12);
  });

  it("maps old saved split names to programs", () => {
    expect(programFor("Push / Pull / Legs").id).toBe("ppl");
    expect(programFor("Superior / Inferior").id).toBe("upper-lower");
    expect(programFor("algo-desconhecido").id).toBe("ppl");
  });

  it("recommends the day whose muscles are recovered", () => {
    const ppl = programFor("ppl");
    const states = MUSCLE_IDS.map((m) =>
      state(m, ["peitoral", "deltoides", "triceps"].includes(m) ? 30 : 100),
    );
    expect(bestDay(rankDays(ppl, states, [], Date.now()))?.day.id).not.toBe("push");
  });

  it("adjusts sets to experience", () => {
    expect(adjustSets(4, 0, "iniciante")).toBe(3);
    expect(adjustSets(2, 3, "iniciante")).toBe(2);
    expect(adjustSets(4, 0, "avancado")).toBe(5);
    expect(adjustSets(3, 2, "avancado")).toBe(3);
    expect(adjustSets(4, 0, "intermediario")).toBe(4);
  });

  it("parses plan keys", () => {
    expect(parsePlan("abc.b")?.day.name).toContain("Costas");
    expect(parsePlan("nope.x")).toBeNull();
  });
});
