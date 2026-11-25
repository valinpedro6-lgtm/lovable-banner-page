import { EXERCISES, type Exercise } from "./exercises";
import type { MuscleId } from "./muscles";
import type { MuscleState } from "./recovery";
import type { CardioActivity, Experience, TrainingLoad, Workout, WorkoutEntry } from "./types";

type Item = [name: string, sets: number, reps: number];

export interface PlanDay {
  id: string;
  name: string;
  items: Item[];
  cardio?: CardioPrescription;
}

export interface CardioPrescription {
  activity: CardioActivity;
  minutes: number;
  focus: string;
}

export interface Program {
  id: string;
  name: string;
  freq: string;
  level: "Todos" | "Iniciante" | "Intermediário" | "Avançado";
  description: string;
  aliases?: string[];
  days: PlanDay[];
}

/* ---------- Exercise blocks ---------- */
const CHEST: Item[] = [
  ["Supino reto com barra", 4, 8],
  ["Supino inclinado com halteres", 3, 10],
  ["Crossover polia média", 3, 12],
];
const CHEST_B: Item[] = [
  ["Supino inclinado com barra", 4, 8],
  ["Supino reto com halteres", 3, 10],
  ["Crucifixo máquina (peck deck)", 3, 12],
];
const SHOULDERS: Item[] = [
  ["Desenvolvimento com halteres sentado", 3, 10],
  ["Elevação lateral com halteres", 4, 14],
];
const REAR: Item[] = [["Face pull", 3, 15]];
const TRICEPS: Item[] = [
  ["Tríceps corda", 3, 12],
  ["Tríceps francês com halter", 3, 10],
];
const BACK: Item[] = [
  ["Barra fixa pronada", 4, 8],
  ["Remada curvada com barra", 4, 8],
  ["Remada baixa no cabo", 3, 12],
];
const BACK_B: Item[] = [
  ["Puxada frontal aberta", 4, 10],
  ["Remada unilateral com halter (serrote)", 3, 10],
  ["Pulldown com braços estendidos", 3, 12],
];
const BICEPS: Item[] = [
  ["Rosca direta com barra", 3, 10],
  ["Rosca martelo", 3, 12],
];
const QUADS: Item[] = [
  ["Agachamento livre (back squat)", 4, 6],
  ["Leg press 45°", 3, 10],
  ["Cadeira extensora", 3, 12],
];
const HAMS: Item[] = [
  ["Levantamento terra romeno (RDL)", 3, 8],
  ["Mesa flexora", 3, 12],
];
const GLUTES: Item[] = [["Hip thrust com barra", 3, 10]];
const CALVES: Item[] = [["Panturrilha em pé na máquina", 4, 12]];
const CORE: Item[] = [
  ["Abdominal na polia (cable crunch)", 3, 12],
  ["Elevação de pernas na barra fixa", 3, 12],
];
const TRAPS: Item[] = [["Encolhimento com halteres", 3, 12]];

export const PROGRAMS: Program[] = [
  {
    id: "ppl",
    name: "Push / Pull / Legs",
    freq: "3 ou 6x por semana",
    level: "Intermediário",
    description: "Empurrar, puxar e pernas. Clássico e equilibrado.",
    aliases: ["Push / Pull / Legs"],
    days: [
      { id: "push", name: "Push · Empurrar", items: [...CHEST, ...SHOULDERS, ...TRICEPS] },
      { id: "pull", name: "Pull · Puxar", items: [...BACK, ...REAR, ...BICEPS] },
      { id: "legs", name: "Legs · Pernas", items: [...QUADS, ...HAMS, ...CALVES] },
    ],
  },
  {
    id: "upper-lower",
    name: "Superior / Inferior",
    freq: "4x por semana",
    level: "Todos",
    description: "Cada músculo 2x na semana, com treinos mais curtos.",
    aliases: ["Superior / Inferior"],
    days: [
      {
        id: "sup-a",
        name: "Superior A",
        items: [
          ["Supino reto com barra", 4, 6],
          ["Remada curvada com barra", 4, 6],
          ...SHOULDERS.slice(0, 1),
          ...BICEPS.slice(0, 1),
          ...TRICEPS.slice(0, 1),
        ],
      },
      {
        id: "inf-a",
        name: "Inferior A",
        items: [["Agachamento livre (back squat)", 4, 6], ...HAMS, ...CALVES, ...CORE.slice(0, 1)],
      },
      {
        id: "sup-b",
        name: "Superior B",
        items: [
          ["Supino inclinado com halteres", 3, 10],
          ["Puxada frontal aberta", 3, 10],
          ["Elevação lateral com halteres", 4, 14],
          ["Rosca martelo", 3, 12],
          ["Tríceps corda", 3, 12],
        ],
      },
      {
        id: "inf-b",
        name: "Inferior B",
        items: [
          ["Leg press 45°", 4, 10],
          ["Agachamento búlgaro", 3, 10],
          ...GLUTES,
          ["Cadeira flexora", 3, 12],
          ["Panturrilha sentado (sóleo)", 4, 15],
        ],
      },
    ],
  },
  {
    id: "full-body",
    name: "Full body",
    freq: "2 ou 3x por semana",
    level: "Iniciante",
    description: "Corpo inteiro em cada treino. Ótimo para começar ou pra quem tem pouco tempo.",
    aliases: ["Full body"],
    days: [
      {
        id: "fb-a",
        name: "Full body A",
        items: [
          ["Agachamento livre (back squat)", 3, 8],
          ["Supino reto com barra", 3, 8],
          ["Remada curvada com barra", 3, 8],
          ["Elevação lateral com halteres", 3, 12],
          ["Abdominal na polia (cable crunch)", 3, 12],
        ],
      },
      {
        id: "fb-b",
        name: "Full body B",
        items: [
          ["Levantamento terra romeno (RDL)", 3, 8],
          ["Desenvolvimento com halteres sentado", 3, 10],
          ["Puxada frontal aberta", 3, 10],
          ["Leg press 45°", 3, 12],
          ["Rosca direta com barra", 2, 12],
        ],
      },
      {
        id: "fb-c",
        name: "Full body C",
        items: [
          ["Agachamento búlgaro", 3, 10],
          ["Supino inclinado com halteres", 3, 10],
          ["Remada baixa no cabo", 3, 12],
          ["Hip thrust com barra", 3, 10],
          ["Tríceps corda", 2, 12],
        ],
      },
    ],
  },
  {
    id: "full-maquinas",
    name: "Full body em máquinas",
    freq: "2 ou 3x por semana",
    level: "Iniciante",
    description: "Só máquinas e polias: seguro e fácil de aprender.",
    days: [
      {
        id: "fm-a",
        name: "Máquinas A",
        items: [
          ["Leg press 45°", 3, 12],
          ["Supino máquina (chest press)", 3, 12],
          ["Puxada frontal aberta", 3, 12],
          ["Cadeira extensora", 2, 15],
          ["Abdominal máquina", 3, 15],
        ],
      },
      {
        id: "fm-b",
        name: "Máquinas B",
        items: [
          ["Agachamento hack (máquina)", 3, 12],
          ["Desenvolvimento máquina", 3, 12],
          ["Remada máquina articulada", 3, 12],
          ["Cadeira flexora", 3, 12],
          ["Panturrilha em pé na máquina", 3, 15],
        ],
      },
    ],
  },
  {
    id: "abc",
    name: "ABC",
    freq: "3 ou 6x por semana",
    level: "Todos",
    description: "A: peito e tríceps · B: costas e bíceps · C: pernas e ombros.",
    aliases: ["ABC"],
    days: [
      {
        id: "a",
        name: "A · Peito e tríceps",
        items: [...CHEST, ["Crucifixo inclinado com halteres", 3, 12], ...TRICEPS],
      },
      { id: "b", name: "B · Costas e bíceps", items: [...BACK, ...REAR, ...BICEPS] },
      {
        id: "c",
        name: "C · Pernas e ombros",
        items: [...QUADS, ...HAMS.slice(0, 1), ...SHOULDERS, ...CALVES],
      },
    ],
  },
  {
    id: "abcd",
    name: "ABCD",
    freq: "4x por semana",
    level: "Intermediário",
    description: "A: peito e tríceps · B: costas e bíceps · C: pernas · D: ombros e abdômen.",
    aliases: ["ABCD"],
    days: [
      { id: "a", name: "A · Peito e tríceps", items: [...CHEST, ...TRICEPS] },
      { id: "b", name: "B · Costas e bíceps", items: [...BACK, ...BICEPS] },
      { id: "c", name: "C · Pernas", items: [...QUADS, ...HAMS, ...GLUTES, ...CALVES] },
      {
        id: "d",
        name: "D · Ombros e abdômen",
        items: [
          ["Desenvolvimento militar com barra", 4, 8],
          ["Elevação lateral com halteres", 4, 14],
          ...REAR,
          ...TRAPS,
          ...CORE,
        ],
      },
    ],
  },
  {
    id: "abcde",
    name: "ABCDE",
    freq: "5x por semana",
    level: "Avançado",
    description: "Um grupo por dia, muito volume por sessão (o famoso “bro split”).",
    days: [
      {
        id: "a",
        name: "A · Peito",
        items: [
          ...CHEST,
          ["Crucifixo inclinado com halteres", 3, 12],
          ["Paralelas com inclinação à frente", 3, 10],
        ],
      },
      {
        id: "b",
        name: "B · Costas",
        items: [...BACK, ["Puxada frontal com triângulo", 3, 10], ...TRAPS],
      },
      { id: "c", name: "C · Pernas", items: [...QUADS, ...HAMS, ...CALVES] },
      {
        id: "d",
        name: "D · Ombros",
        items: [
          ["Desenvolvimento militar com barra", 4, 8],
          ["Elevação lateral com halteres", 4, 14],
          ["Elevação lateral no cabo", 3, 15],
          ...REAR,
        ],
      },
      {
        id: "e",
        name: "E · Braços",
        items: [
          ...BICEPS,
          ["Rosca Scott com barra", 3, 10],
          ...TRICEPS,
          ["Mergulho nas paralelas", 3, 10],
        ],
      },
    ],
  },
  {
    id: "arnold",
    name: "Arnold split",
    freq: "3 ou 6x por semana",
    level: "Avançado",
    description: "Peito com costas, ombros com braços e pernas. Treinos longos e intensos.",
    days: [
      {
        id: "pc",
        name: "Peito e costas",
        items: [...CHEST.slice(0, 2), ...BACK.slice(0, 2), ["Pullover com halter", 3, 12]],
      },
      {
        id: "ob",
        name: "Ombros e braços",
        items: [
          ["Desenvolvimento Arnold", 4, 10],
          ["Elevação lateral com halteres", 4, 14],
          ...BICEPS,
          ...TRICEPS,
        ],
      },
      { id: "pe", name: "Pernas", items: [...QUADS, ...HAMS, ...CALVES, ...CORE.slice(0, 1)] },
    ],
  },
  {
    id: "phul",
    name: "PHUL",
    freq: "4x por semana",
    level: "Intermediário",
    description: "Dois dias de força e dois de hipertrofia, superior e inferior.",
    days: [
      {
        id: "sf",
        name: "Superior · força",
        items: [
          ["Supino reto com barra", 4, 5],
          ["Remada curvada com barra", 4, 5],
          ["Desenvolvimento militar com barra", 3, 6],
          ["Barra fixa com peso", 3, 6],
        ],
      },
      {
        id: "if",
        name: "Inferior · força",
        items: [
          ["Agachamento livre (back squat)", 4, 5],
          ["Levantamento terra convencional", 3, 5],
          ["Leg press 45°", 3, 8],
          ...CALVES,
        ],
      },
      {
        id: "sh",
        name: "Superior · hipertrofia",
        items: [
          ["Supino inclinado com halteres", 4, 10],
          ["Puxada frontal aberta", 4, 10],
          ["Elevação lateral com halteres", 4, 14],
          ...BICEPS.slice(0, 1),
          ...TRICEPS.slice(0, 1),
        ],
      },
      {
        id: "ih",
        name: "Inferior · hipertrofia",
        items: [
          ["Agachamento frontal", 3, 10],
          ["Agachamento búlgaro", 3, 10],
          ["Cadeira extensora", 3, 15],
          ["Mesa flexora", 3, 12],
          ["Panturrilha sentado (sóleo)", 4, 15],
        ],
      },
    ],
  },
  {
    id: "ppl-ul",
    name: "PPL + Superior/Inferior",
    freq: "5x por semana",
    level: "Intermediário",
    description: "Push, pull e pernas, depois superior e inferior. Cada músculo ~2x por semana.",
    days: [
      { id: "push", name: "Push", items: [...CHEST, ...SHOULDERS, ...TRICEPS.slice(0, 1)] },
      { id: "pull", name: "Pull", items: [...BACK, ...BICEPS.slice(0, 1)] },
      { id: "legs", name: "Pernas", items: [...QUADS, ...HAMS, ...CALVES] },
      {
        id: "upper",
        name: "Superior",
        items: [
          ...CHEST_B.slice(0, 1),
          ...BACK_B.slice(0, 2),
          ["Elevação lateral com halteres", 3, 14],
          ["Rosca alternada com halteres", 3, 10],
        ],
      },
      {
        id: "lower",
        name: "Inferior",
        items: [
          ["Agachamento hack (máquina)", 3, 10],
          ...GLUTES,
          ["Cadeira flexora", 3, 12],
          ...CORE,
        ],
      },
    ],
  },
  {
    id: "gluteos",
    name: "Foco em glúteos e pernas",
    freq: "3 a 5x por semana",
    level: "Todos",
    description: "Dois dias de pernas com ênfase em glúteos e um de superiores.",
    days: [
      {
        id: "ga",
        name: "Glúteos e posteriores",
        items: [
          ["Hip thrust com barra", 4, 10],
          ["Levantamento terra romeno (RDL)", 3, 10],
          ["Cadeira abdutora", 3, 15],
          ["Glúteo na polia (coice)", 3, 12],
          ["Mesa flexora", 3, 12],
        ],
      },
      {
        id: "sup",
        name: "Superiores",
        items: [
          ["Puxada frontal aberta", 3, 12],
          ["Supino reto com halteres", 3, 10],
          ["Remada baixa no cabo", 3, 12],
          ["Elevação lateral com halteres", 3, 15],
          ["Abdominal na polia (cable crunch)", 3, 15],
        ],
      },
      {
        id: "gq",
        name: "Glúteos e quadríceps",
        items: [
          ["Agachamento livre (back squat)", 4, 8],
          ["Agachamento búlgaro", 3, 10],
          ["Leg press 45°", 3, 12],
          ["Elevação pélvica no banco com halter", 3, 12],
          ["Panturrilha em pé na máquina", 3, 15],
        ],
      },
    ],
  },
  {
    id: "calistenia",
    name: "Calistenia",
    freq: "3x por semana",
    level: "Todos",
    description: "Só peso corporal e uma barra fixa. Dá pra fazer em casa ou na praça.",
    days: [
      {
        id: "emp",
        name: "Empurrar",
        items: [
          ["Flexão de braço", 4, 12],
          ["Paralelas com inclinação à frente", 3, 10],
          ["Pike push-up", 3, 10],
          ["Mergulho no banco", 3, 12],
          ["Flexão diamante", 2, 10],
        ],
      },
      {
        id: "pux",
        name: "Puxar",
        items: [
          ["Barra fixa pronada", 4, 6],
          ["Barra fixa supinada (chin-up)", 3, 8],
          ["Remada invertida (australiana)", 3, 12],
          ["Elevação de pernas na barra fixa", 3, 10],
        ],
      },
      {
        id: "per",
        name: "Pernas e core",
        items: [
          ["Agachamento búlgaro", 3, 10],
          ["Afundo reverso", 3, 12],
          ["Ponte unilateral", 3, 12],
          ["Panturrilha no degrau", 4, 15],
          ["Abdominal bicicleta", 3, 20],
        ],
      },
    ],
  },
  {
    id: "hibrido",
    name: "Treino híbrido",
    freq: "4x por semana",
    level: "Todos",
    description:
      "Força e cardio combinados em uma divisão equilibrada para condicionamento completo.",
    days: [
      {
        id: "superior-a",
        name: "Superior A + bike",
        items: [
          ...CHEST.slice(0, 2),
          ...BACK.slice(0, 2),
          ...SHOULDERS.slice(0, 1),
          ...TRICEPS.slice(0, 1),
        ],
        cardio: { activity: "Bicicleta", minutes: 20, focus: "Ritmo contínuo moderado · zona 2" },
      },
      {
        id: "inferior-a",
        name: "Inferior A + intervalos",
        items: [...QUADS, ...HAMS.slice(0, 1), ...GLUTES, ...CALVES],
        cardio: { activity: "Corrida", minutes: 15, focus: "Intervalos: 1 min forte / 1 min leve" },
      },
      {
        id: "superior-b",
        name: "Superior B + elíptico",
        items: [
          ...CHEST_B.slice(0, 1),
          ...BACK_B.slice(0, 2),
          ...SHOULDERS.slice(1),
          ...BICEPS,
          ...TRICEPS.slice(1),
        ],
        cardio: { activity: "Elíptico", minutes: 25, focus: "Ritmo contínuo confortável" },
      },
      {
        id: "inferior-b",
        name: "Inferior B + escada",
        items: [
          ["Agachamento búlgaro", 3, 10],
          ["Leg press 45°", 3, 12],
          ...HAMS.slice(1),
          ...GLUTES,
          ...CALVES,
        ],
        cardio: { activity: "Escada", minutes: 15, focus: "Ritmo constante · esforço moderado" },
      },
    ],
  },
  {
    id: "livre",
    name: "Livre · o app escolhe",
    freq: "Quando quiser",
    level: "Todos",
    description: "Sem divisão fixa: o app monta o treino com os músculos mais recuperados.",
    aliases: ["Livre"],
    days: [
      {
        id: "push",
        name: "Push · Empurrar",
        items: [...CHEST.slice(0, 2), ...SHOULDERS, ...TRICEPS.slice(0, 1)],
      },
      { id: "pull", name: "Pull · Puxar", items: [...BACK, ...BICEPS.slice(0, 1)] },
      { id: "legs", name: "Pernas", items: [...QUADS, ...HAMS.slice(0, 1), ...CALVES] },
      {
        id: "upper",
        name: "Superiores",
        items: [
          ...CHEST_B.slice(0, 1),
          ...BACK_B.slice(0, 1),
          ["Elevação lateral com halteres", 3, 14],
          ...BICEPS.slice(0, 1),
          ...TRICEPS.slice(0, 1),
        ],
      },
      {
        id: "core",
        name: "Core e lombar",
        items: [
          ...CORE,
          ["Hiperextensão lombar (banco romano)", 3, 12],
          ["Prancha lateral", 3, 30],
        ],
      },
    ],
  },
];

const BY_NAME = new Map(EXERCISES.map((e) => [e.name, e]));

export function exerciseFor(name: string): Exercise | undefined {
  return BY_NAME.get(name);
}

export function programFor(split: string | undefined): Program {
  return (
    PROGRAMS.find((p) => p.id === split || p.name === split || p.aliases?.includes(split ?? "")) ??
    PROGRAMS[0]!
  );
}

/** Primary muscles a day works, in order of appearance. */
export function dayMuscles(day: PlanDay): MuscleId[] {
  const out: MuscleId[] = [];
  for (const [name] of day.items) {
    const ex = exerciseFor(name);
    if (ex && !out.includes(ex.muscle)) out.push(ex.muscle);
  }
  return out;
}

export const planKey = (p: Program, d: PlanDay) => `${p.id}.${d.id}`;

export function parsePlan(key: string | undefined): { program: Program; day: PlanDay } | null {
  if (!key) return null;
  const [pid, did] = key.split(".");
  const program = PROGRAMS.find((p) => p.id === pid);
  const day = program?.days.find((d) => d.id === did);
  return program && day ? { program, day } : null;
}

export interface RankedDay {
  day: PlanDay;
  index: number;
  muscles: MuscleId[];
  /** 0–100: how ready the day's muscles are, accounting for soreness and very recent work. */
  readiness: number;
  /** Next day in the rotation after the last plan day you logged. */
  isNext: boolean;
  /** Muscles in this day still below 70 %. */
  tired: MuscleId[];
}

const HOUR = 3_600_000;

export function rankDays(
  program: Program,
  states: MuscleState[],
  workouts: Workout[],
  now: number,
): RankedDay[] {
  const byId = new Map(states.map((s) => [s.muscle, s]));
  const last = [...workouts]
    .filter((w) => w.planId?.startsWith(`${program.id}.`) && new Date(w.date).getTime() <= now)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastIdx = last ? program.days.findIndex((d) => planKey(program, d) === last.planId) : -1;
  const nextIdx = lastIdx >= 0 ? (lastIdx + 1) % program.days.length : -1;

  return program.days.map((day, index) => {
    const muscles = dayMuscles(day);
    let total = 0;
    for (const m of muscles) {
      const s = byId.get(m);
      if (!s) continue;
      let v = s.pct - s.soreness * 15;
      if (s.lastStimulus && now - s.lastStimulus < 36 * HOUR) v -= 20;
      total += v;
    }
    let score = muscles.length ? total / muscles.length : 0;
    if (index === nextIdx) score += 8;
    return {
      day,
      index,
      muscles,
      readiness: Math.max(0, Math.min(100, Math.round(score))),
      isNext: index === nextIdx,
      tired: muscles.filter((m) => (byId.get(m)?.pct ?? 100) < 70),
    };
  });
}

export function bestDay(ranked: RankedDay[]): RankedDay | undefined {
  return [...ranked].sort((a, b) => b.readiness - a.readiness || a.index - b.index)[0];
}

/** Sets adjusted to experience: beginners do one set less, advanced one more on the first two lifts. */
export function adjustSets(sets: number, index: number, experience: Experience): number {
  if (experience === "iniciante") return Math.max(2, sets - 1);
  if (experience === "avancado" && index < 2) return sets + 1;
  return sets;
}

export function adjustLoadSets(
  sets: number,
  index: number,
  load: TrainingLoad = "moderado",
): number {
  if (load === "leve") return Math.max(2, sets - 1);
  if (load === "pesado" && index < 3) return sets + 1;
  return sets;
}

export function adjustReps(reps: number, load: TrainingLoad = "moderado"): number {
  if (load === "leve") return reps + 2;
  if (load === "pesado") return Math.max(5, reps - 2);
  return reps;
}

export function lastLoads(workouts: Workout[]): Map<string, number> {
  const map = new Map<string, number>();
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));
  for (const w of sorted)
    for (const e of w.entries) if (e.exerciseId) map.set(e.exerciseId, e.load);
  return map;
}

export type PlanEntry = Omit<WorkoutEntry, "id"> & { name: string };

export function buildEntries(
  day: PlanDay,
  experience: Experience,
  loads: Map<string, number>,
  trainingLoad: TrainingLoad = "moderado",
): PlanEntry[] {
  const out: PlanEntry[] = [];
  day.items.forEach(([name, sets, reps], i) => {
    const ex = exerciseFor(name);
    if (!ex) return;
    out.push({
      exerciseId: ex.id,
      name: ex.name,
      muscle: ex.muscle,
      secondary: ex.secondary,
      sets: adjustLoadSets(adjustSets(sets, i, experience), i, trainingLoad),
      reps: adjustReps(reps, trainingLoad),
      load: loads.get(ex.id) ?? 0,
      rpe:
        trainingLoad === "leve"
          ? 6
          : trainingLoad === "pesado"
            ? 9
            : experience === "iniciante"
              ? 7
              : 8,
    });
  });
  return out;
}
