import type { ActivityLevel, BodyGoal, Profile } from "./types";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  alto: 1.725,
};

export function restingEnergyEstimate(profile: Profile): number | null {
  const { age, weight, height, calculationSex } = profile;
  if (
    age === null ||
    age < 19 ||
    age > 78 ||
    weight === null ||
    weight < 30 ||
    weight > 300 ||
    height === null ||
    height < 100 ||
    height > 240 ||
    calculationSex === null
  ) {
    return null;
  }

  const sexConstant = calculationSex === "masculino" ? 5 : -161;
  const kcal = 10 * weight + 6.25 * height - 5 * age + sexConstant;
  return Math.round(kcal);
}

/** Approximate maintenance energy only; this is not a calorie-intake prescription. */
export function maintenanceEnergyEstimate(profile: Profile): number | null {
  const resting = restingEnergyEstimate(profile);
  if (resting === null) return null;
  const activity = profile.activityLevel ?? "leve";
  const estimate = resting * ACTIVITY_MULTIPLIER[activity];
  if (estimate < 1200 || estimate > 6000) return null;
  return Math.round(estimate / 50) * 50;
}

export function proteinEstimate(
  profile: Profile,
): { min: number; max: number; midpoint: number } | null {
  if (
    profile.age === null ||
    profile.age < 18 ||
    profile.weight === null ||
    profile.weight < 30 ||
    profile.weight > 300
  ) {
    return null;
  }
  const min = Math.round(profile.weight * 1.4);
  const max = Math.round(profile.weight * 2.0);
  return { min, max, midpoint: Math.round(profile.weight * 1.6) };
}

export function hydrationGoal(profile: Profile): number {
  const requested = profile.waterGoalMl;
  if (typeof requested === "number" && Number.isFinite(requested)) {
    return Math.max(500, Math.min(6000, Math.round(requested / 100) * 100));
  }
  return 2500;
}

export function goalMilestones(startWeight: number, targetWeight: number, stepKg = 5): number[] {
  if (
    !Number.isFinite(startWeight) ||
    !Number.isFinite(targetWeight) ||
    startWeight === targetWeight ||
    stepKg <= 0
  ) {
    return [];
  }
  const direction = Math.sign(targetWeight - startWeight);
  const distance = Math.abs(targetWeight - startWeight);
  const count = Math.ceil(distance / stepKg);
  return Array.from({ length: count }, (_, index) => {
    const covered = Math.min((index + 1) * stepKg, distance);
    return Math.round((startWeight + direction * covered) * 10) / 10;
  });
}

export function goalProgress(
  startWeight: number,
  currentWeight: number,
  targetWeight: number,
): number {
  const total = Math.abs(targetWeight - startWeight);
  if (total === 0) return 100;
  const direction = Math.sign(targetWeight - startWeight);
  const covered = (currentWeight - startWeight) * direction;
  return Math.round(Math.max(0, Math.min(100, (covered / total) * 100)));
}

export function goalLabel(goal: BodyGoal | undefined): string {
  switch (goal) {
    case "emagrecer":
      return "Emagrecer";
    case "ganhar_massa":
      return "Ganhar massa muscular";
    case "ganhar_peso":
      return "Ganhar peso";
    default:
      return "Manter";
  }
}
