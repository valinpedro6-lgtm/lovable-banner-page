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

export interface DietSuggestion {
  title: string;
  description: string;
  example: string;
}

/** Practical meal ideas that scale portions from the person's weight without prescribing calories. */
export function dietSuggestions(profile: Profile): DietSuggestion[] {
  const weight = profile.weight;
  const protein = proteinEstimate(profile);
  const perMeal = protein ? Math.max(20, Math.round(protein.midpoint / 4)) : null;
  const proteinText = perMeal ? `cerca de ${perMeal} g de proteína` : "uma fonte de proteína";
  const goal = profile.goal ?? "manter";

  const base: DietSuggestion[] = [
    {
      title: "Prato completo",
      description: `Em uma refeição principal, combine ${proteinText}, muitos vegetais e uma porção de carboidrato que caiba na sua rotina.`,
      example: "Frango, arroz, feijão e salada; ou tofu, batata e legumes.",
    },
    {
      title: "Café da manhã ou lanche",
      description: "Priorize proteína e fibra para ter mais saciedade e facilitar a constância.",
      example: "Iogurte natural com aveia e fruta; ou ovos com pão integral.",
    },
    {
      title: "Perto do treino",
      description:
        "Se treinar com fome, use uma combinação simples de carboidrato e proteína; ajuste o volume ao seu conforto.",
      example: "Banana com iogurte; ou sanduíche de atum e uma fruta.",
    },
  ];

  if (goal === "ganhar_massa" || goal === "ganhar_peso") {
    base.push({
      title: "Mais energia sem exagero",
      description:
        "Para ganhar massa ou peso, acrescente uma pequena porção de carboidrato ou gordura boa às refeições e acompanhe a evolução do peso.",
      example: "Azeite na salada, pasta de amendoim, castanhas ou uma porção extra de arroz.",
    });
  } else if (goal === "emagrecer") {
    base.push({
      title: "Mais volume, mesma praticidade",
      description:
        "Para emagrecer, aumente vegetais e proteínas magras, mantenha alimentos que gosta e evite transformar a estimativa em uma meta rígida.",
      example: "Sopa com carne e legumes; ou bowl com folhas, grão-de-bico e frango.",
    });
  } else {
    base.push({
      title: "Manutenção sustentável",
      description:
        "Para manter, distribua refeições equilibradas e observe fome, energia e evolução ao longo das semanas.",
      example: "Arroz, feijão, carne ou leguminosa, legumes e fruta ao longo do dia.",
    });
  }

  if (weight === null) {
    return base;
  }
  return base.map((item) => ({
    ...item,
    description: item.description.replace("sua rotina", `seu peso de ${weight} kg e sua rotina`),
  }));
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
