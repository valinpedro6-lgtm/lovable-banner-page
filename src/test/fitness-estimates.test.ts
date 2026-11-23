import { describe, expect, it } from "vitest";
import {
  goalMilestones,
  goalProgress,
  hydrationGoal,
  maintenanceEnergyEstimate,
  proteinEstimate,
  restingEnergyEstimate,
} from "@/lib/fitness-estimates";
import type { Profile } from "@/lib/types";

const profile: Profile = {
  name: "Ana",
  age: 30,
  weight: 80,
  height: 170,
  experience: "intermediario",
  weeklyFrequency: 3,
  split: "ppl",
  goal: "emagrecer",
  targetWeight: 60,
  activityLevel: "leve",
  calculationSex: "feminino",
  waterGoalMl: 2500,
};

describe("fitness estimates", () => {
  it("estimates resting energy only when required profile details exist", () => {
    expect(restingEnergyEstimate(profile)).toBe(1552);
    expect(restingEnergyEstimate({ ...profile, calculationSex: null })).toBeNull();
    expect(restingEnergyEstimate({ ...profile, age: 17 })).toBeNull();
  });

  it("estimates maintenance energy without applying a goal-based calorie prescription", () => {
    expect(maintenanceEnergyEstimate(profile)).toBe(2150);
    expect(maintenanceEnergyEstimate({ ...profile, age: null })).toBeNull();
    expect(maintenanceEnergyEstimate({ ...profile, weight: 30, height: 100, age: 78 })).toBeNull();
  });

  it("returns the general exercise protein range", () => {
    expect(proteinEstimate(profile)).toEqual({ min: 112, max: 160, midpoint: 128 });
    expect(proteinEstimate({ ...profile, age: 16 })).toBeNull();
  });

  it("clamps and rounds the editable water goal", () => {
    expect(hydrationGoal(profile)).toBe(2500);
    expect(hydrationGoal({ ...profile, waterGoalMl: 99 })).toBe(500);
    expect(hydrationGoal({ ...profile, waterGoalMl: 9000 })).toBe(6000);
  });

  it("creates gradual 5 kg steps and handles a final shorter step", () => {
    expect(goalMilestones(90, 70)).toEqual([85, 80, 75, 70]);
    expect(goalMilestones(70, 62)).toEqual([65, 62]);
    expect(goalMilestones(70, 70)).toEqual([]);
  });

  it("clamps progress to the goal range and direction", () => {
    expect(goalProgress(90, 80, 70)).toBe(50);
    expect(goalProgress(90, 95, 70)).toBe(0);
    expect(goalProgress(90, 70, 70)).toBe(100);
  });
});
