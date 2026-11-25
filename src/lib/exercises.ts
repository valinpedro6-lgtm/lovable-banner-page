import { isMuscleId, type MuscleId } from "./muscles";

export type Equipment =
  | "Barra"
  | "Halteres"
  | "Máquina"
  | "Cabo"
  | "Peso corporal"
  | "Kettlebell"
  | "Elástico"
  | "Smith"
  | "Anilha"
  | "Outros";

export const EQUIPMENT: Record<string, Equipment> = {
  B: "Barra",
  H: "Halteres",
  M: "Máquina",
  C: "Cabo",
  P: "Peso corporal",
  K: "Kettlebell",
  E: "Elástico",
  S: "Smith",
  A: "Anilha",
  O: "Outros",
};

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleId;
  secondary: MuscleId[];
  equipment: Equipment;
  custom?: boolean;
}

// Format per line: Nome|equipamento|secundários (vírgula)
const RAW: Record<MuscleId, string> = {
  peitoral: `
Supino reto com barra|B|triceps,deltoides
Supino reto com halteres|H|triceps,deltoides
Supino inclinado com barra|B|deltoides,triceps
Supino inclinado com halteres|H|deltoides,triceps
Supino declinado com barra|B|triceps
Supino declinado com halteres|H|triceps
Supino reto no Smith|S|triceps,deltoides
Supino inclinado no Smith|S|deltoides,triceps
Supino declinado no Smith|S|triceps
Supino máquina (chest press)|M|triceps,deltoides
Supino inclinado máquina|M|deltoides,triceps
Chest press unilateral|M|triceps
Supino com pausa|B|triceps,deltoides
Supino guilhotina|B|deltoides
Supino com halteres pegada neutra|H|triceps
Floor press com halteres|H|triceps
Crucifixo reto com halteres|H|deltoides
Crucifixo inclinado com halteres|H|deltoides
Crucifixo declinado com halteres|H|
Crucifixo máquina (peck deck)|M|deltoides
Crossover polia alta|C|deltoides
Crossover polia média|C|deltoides
Crossover polia baixa|C|deltoides
Crucifixo no cabo deitado|C|
Crucifixo unilateral no cabo|C|
Flexão de braço|P|triceps,deltoides,abdomen
Flexão inclinada|P|triceps,deltoides
Flexão declinada|P|deltoides,triceps
Flexão com palmas (pliométrica)|P|triceps,deltoides
	Flexão archer|P|triceps
	Flexão pseudo-planche|P|triceps,deltoides,abdomen
	Flexão hindu|P|triceps,deltoides
	Flexão nas argolas|O|triceps,deltoides
Paralelas com inclinação à frente|P|triceps,deltoides
Pullover com halter|H|dorsais,triceps
Svend press|A|deltoides
Plate press|A|deltoides
Landmine press|B|deltoides,triceps
Supino com elástico|E|triceps
Crucifixo com elástico|E|`,
  deltoides: `
Desenvolvimento militar com barra|B|triceps,trapezio
Desenvolvimento com halteres sentado|H|triceps
Desenvolvimento com halteres em pé|H|triceps,abdomen
Desenvolvimento Arnold|H|triceps
Desenvolvimento no Smith|S|triceps
Desenvolvimento máquina|M|triceps
Desenvolvimento por trás da nuca|B|triceps,trapezio
Desenvolvimento com kettlebell|K|triceps
Push press|B|triceps,quadriceps
Z press|B|triceps,abdomen
Bradford press|B|triceps
Landmine press unilateral|B|peitoral,triceps
Pike push-up|P|triceps
Flexão em parada de mão (HSPU)|P|triceps,trapezio
Elevação lateral com halteres|H|trapezio
Elevação lateral no cabo|C|trapezio
Elevação lateral máquina|M|
Elevação lateral inclinada|H|
Elevação lateral sentado|H|
Elevação lateral com elástico|E|
Lu raise|A|trapezio
Elevação frontal com halteres|H|peitoral
Elevação frontal com barra|B|peitoral
Elevação frontal com anilha|A|peitoral
Elevação frontal no cabo|C|peitoral
Crucifixo invertido com halteres|H|trapezio
Crucifixo invertido máquina (peck deck inverso)|M|trapezio
Crucifixo invertido no cabo|C|trapezio
Face pull|C|trapezio
Remada alta com barra|B|trapezio,biceps
Remada alta no cabo|C|trapezio
Elevação em Y (Y-raise)|H|trapezio
Cuban press|H|`,
  trapezio: `
Encolhimento com barra|B|antebracos
Encolhimento com halteres|H|antebracos
Encolhimento no Smith|S|
Encolhimento na máquina|M|
Encolhimento no cabo|C|
Encolhimento por trás com barra|B|
Encolhimento com trap bar|B|antebracos
Encolhimento inclinado com halteres|H|
Encolhimento com kettlebell|K|
Kirk shrug|B|
Power shrug|B|quadriceps
Farmer's walk|H|antebracos,abdomen
Carry acima da cabeça|K|deltoides,abdomen
Rack pull|B|lombar,gluteos,antebracos
Remada alta pegada aberta|B|deltoides
Snatch-grip high pull|B|deltoides,posteriores
Remada com cotovelos abertos|B|dorsais,deltoides
Prone Y-T-W|H|deltoides
Scap pull-up (elevação escapular)|P|dorsais`,
  dorsais: `
Barra fixa pronada|P|biceps,antebracos
Barra fixa supinada (chin-up)|P|biceps
Barra fixa pegada neutra|P|biceps
Barra fixa com peso|O|biceps
Barra fixa assistida|M|biceps
Muscle-up|P|triceps,peitoral
Puxada frontal aberta|C|biceps
Puxada frontal com triângulo|C|biceps
Puxada supinada|C|biceps
Puxada unilateral no cabo|C|biceps
Puxada atrás da nuca|C|biceps
Pulldown com braços estendidos|C|triceps
Remada curvada com barra|B|biceps,lombar,trapezio
Remada curvada supinada (Yates)|B|biceps,lombar
Remada Pendlay|B|lombar,trapezio
Remada unilateral com halter (serrote)|H|biceps
Remada baixa no cabo|C|biceps,trapezio
Remada cavalinho (T-bar)|B|biceps,lombar
Remada máquina articulada|M|biceps
Remada no Smith|S|biceps
Seal row|B|biceps,trapezio
Remada com halteres no banco inclinado|H|biceps,trapezio
Remada invertida (australiana)|P|biceps
Remada Meadows|B|biceps
Remada Kroc|H|biceps,antebracos
Remada com kettlebell|K|biceps
Remada gorila|K|biceps,abdomen
Remada com elástico|E|biceps
Remada no TRX|O|biceps
Pullover no cabo|C|
Pullover máquina|M|`,
  lombar: `
Levantamento terra convencional|B|posteriores,gluteos,trapezio
Levantamento terra sumô|B|gluteos,quadriceps
Levantamento terra com trap bar|B|quadriceps,gluteos
Levantamento terra com déficit|B|posteriores,gluteos
Levantamento terra com halteres|H|posteriores,gluteos
Levantamento terra com kettlebell|K|gluteos,posteriores
Good morning|B|posteriores,gluteos
Good morning sentado|B|
Hiperextensão lombar (banco romano)|P|gluteos,posteriores
Hiperextensão com anilha|A|gluteos,posteriores
Extensão lombar na máquina|M|gluteos
Reverse hyper|M|gluteos,posteriores
Superman|P|gluteos
Bird dog|P|abdomen,gluteos
Jefferson curl|B|posteriores
Extensão lombar com rotação|P|abdomen`,
  biceps: `
Rosca direta com barra|B|antebracos
Rosca direta com barra W|B|antebracos
Rosca alternada com halteres|H|antebracos
Rosca simultânea com halteres|H|antebracos
Rosca martelo|H|antebracos
Rosca martelo cruzada|H|antebracos
Rosca concentrada|H|
Rosca Scott com barra|B|
Rosca Scott com halter|H|
Rosca Scott máquina|M|
Rosca inclinada com halteres|H|
Rosca spider|B|
Rosca no cabo (polia baixa)|C|antebracos
Rosca com corda no cabo|C|antebracos
Rosca bayesiana no cabo|C|
Rosca alta no cabo|C|
Rosca 21|B|antebracos
Rosca drag|B|
Rosca Zottman|H|antebracos
Rosca com elástico|E|
Rosca com kettlebell|K|antebracos
Rosca máquina|M|
Rosca pegada fechada|B|
Rosca pegada aberta|B|
Rosca waiter|H|
Chin-up isométrico|P|dorsais`,
  triceps: `
Tríceps pulley com barra|C|
Tríceps corda|C|
Tríceps pulley pegada invertida|C|
Tríceps unilateral no cabo|C|
Tríceps overhead no cabo|C|
Tríceps cross no cabo|C|
Tríceps testa no cabo|C|
Tríceps coice no cabo|C|
Tríceps francês com halter|H|
Tríceps francês com barra W|B|
Tríceps testa com barra W|B|
Tríceps testa com halteres|H|
Tríceps coice com halter|H|
Tate press|H|
Supino pegada fechada|B|peitoral,deltoides
Supino fechado no Smith|S|peitoral
Floor press pegada fechada|B|peitoral
JM press|B|peitoral
Mergulho nas paralelas|P|peitoral,deltoides
Mergulho no banco|P|deltoides
Flexão diamante|P|peitoral
Tríceps máquina|M|
Mergulho máquina|M|peitoral
Extensão de tríceps com elástico|E|
Tríceps overhead com kettlebell|K|
Extensão de tríceps no TRX|O|`,
  antebracos: `
Rosca de punho com barra|B|
Rosca de punho com halter|H|
Rosca de punho inversa|B|
Rosca de punho atrás das costas|B|
Rosca inversa com barra|B|biceps
Rosca inversa no cabo|C|biceps
Wrist roller|O|
Plate pinch (pinça de anilhas)|A|
Hand gripper|O|
Dead hang (suspensão na barra)|P|dorsais
Pronação e supinação com halter|H|
Desvio radial com halter|H|
Fat grip hold|O|
	Barra fixa na toalha|P|dorsais,biceps
	Barra fixa excêntrica|P|biceps
	Barra fixa isométrica|P|biceps,antebracos
	Extensão de dedos com elástico|E|`,
  abdomen: `
Abdominal crunch|P|
Abdominal infra (elevação de pernas)|P|
Elevação de pernas na barra fixa|P|antebracos
Elevação de joelhos na barra|P|
Elevação de pernas no captain's chair|P|
Toes to bar|P|antebracos,dorsais
Prancha frontal|P|deltoides
Prancha lateral|P|
Prancha com toque no ombro|P|deltoides
Saw plank|P|deltoides
Abdominal na polia (cable crunch)|C|
Abdominal máquina|M|
Abdominal bicicleta|P|
Abdominal remador|P|
Abdominal oblíquo|P|
Abdominal declinado|P|
Abdominal tesoura|P|
Sit-up|P|
V-up|P|
Reverse crunch|P|
Russian twist|A|
Roda abdominal (ab wheel)|O|dorsais
Dragon flag|P|
Hollow hold|P|
L-sit|P|triceps
Dead bug|P|
Mountain climber|P|deltoides,quadriceps
Pallof press|C|
Woodchopper no cabo|C|
Flexão lateral com halter|H|
Stir the pot|O|
Windshield wipers|P|`,
  quadriceps: `
Agachamento livre (back squat)|B|gluteos,posteriores,lombar
Agachamento frontal|B|gluteos,abdomen
Agachamento com pausa|B|gluteos
Agachamento box|B|gluteos,posteriores
Agachamento zercher|B|gluteos,abdomen
Agachamento overhead|B|deltoides,abdomen
Hack squat com barra|B|gluteos
Thruster|B|deltoides,gluteos
Agachamento no Smith|S|gluteos
Agachamento hack (máquina)|M|gluteos
Pendulum squat|M|gluteos
Belt squat|M|gluteos
Leg press 45°|M|gluteos,posteriores
Leg press horizontal|M|gluteos
Leg press unilateral|M|gluteos
Cadeira extensora|M|
Extensora unilateral|M|
Agachamento goblet|K|gluteos
Agachamento com kettlebell duplo|K|gluteos
Agachamento com halteres|H|gluteos
Agachamento sumô com halter|H|gluteos
Agachamento búlgaro|H|gluteos,posteriores
Afundo com halteres|H|gluteos
Afundo com barra|B|gluteos
Afundo reverso|H|gluteos
Avanço caminhando (walking lunge)|H|gluteos,posteriores
Passada lateral|H|gluteos
Step-up no banco|H|gluteos
Agachamento sissy|P|
	Agachamento pistol|P|gluteos
	Agachamento shrimp|P|gluteos,posteriores
	Agachamento isométrico na parede|P|
	Agachamento cossaco|P|gluteos
Agachamento com salto|P|gluteos,panturrilhas
Wall sit (cadeirinha)|P|
Reverse nordic|P|
Spanish squat|E|`,
  posteriores: `
Stiff com barra|B|gluteos,lombar
Stiff com halteres|H|gluteos,lombar
Stiff no Smith|S|gluteos
Stiff com kettlebell|K|gluteos
Levantamento terra romeno (RDL)|B|gluteos,lombar
RDL unilateral com halter|H|gluteos
Single-leg deadlift com kettlebell|K|gluteos
Mesa flexora|M|
Cadeira flexora|M|
Flexora em pé unilateral|M|
Flexora no cabo|C|
Flexora com caneleira|O|
Flexora com elástico|E|
Flexão nórdica (nordic curl)|P|
Glute-ham raise (GHR)|M|gluteos
Flexão de joelho na bola suíça|O|gluteos
Flexão de joelho com slider|P|gluteos`,
  gluteos: `
Hip thrust com barra|B|posteriores
Hip thrust máquina|M|posteriores
Hip thrust unilateral|P|posteriores
Elevação pélvica no banco com halter|H|posteriores
Ponte de glúteo|P|posteriores
Ponte de glúteo com barra|B|posteriores
Ponte unilateral|P|posteriores
Kas glute bridge|B|
Frog pump|P|
Glúteo na polia (coice)|C|posteriores
Glúteo máquina (coice)|M|posteriores
Glúteo 4 apoios (donkey kick)|P|posteriores
Fire hydrant|P|
Cadeira abdutora|M|
Abdução no cabo|C|
Abdução deitado lateral|P|
Abdução de quadril em pé|P|
Clamshell com elástico|E|
Monster walk com elástico|E|quadriceps
Kettlebell swing|K|posteriores,lombar
Pull-through no cabo|C|posteriores
Agachamento sumô com barra|B|quadriceps,posteriores
Agachamento B-stance|H|quadriceps
Step-up alto|H|quadriceps
Afundo cruzado (curtsy lunge)|H|quadriceps
Hiperextensão para glúteo|P|posteriores,lombar`,
  panturrilhas: `
Panturrilha em pé na máquina|M|
Panturrilha sentado (sóleo)|M|
Panturrilha no leg press|M|
Panturrilha no hack|M|
Panturrilha burrinho (donkey calf)|M|
Panturrilha no Smith|S|
Panturrilha com barra|B|
Panturrilha unilateral com halter|H|
Panturrilha sentado com halteres|H|
Panturrilha com kettlebell|K|
Panturrilha no degrau|P|
Caminhada na ponta dos pés|P|
Elevação de ponta de pé (tibial)|P|
Pogo jumps|P|
Pular corda|O|quadriceps
Salto na caixa (box jump)|P|quadriceps,gluteos`,
};

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parse(): Exercise[] {
  const out: Exercise[] = [];
  const seen = new Set<string>();
  for (const [muscle, block] of Object.entries(RAW) as [MuscleId, string][]) {
    for (const line of block.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      const [name = "", eq = "O", sec = ""] = t.split("|");
      let id = slugify(name);
      if (seen.has(id)) id = `${id}-${muscle}`;
      seen.add(id);
      out.push({
        id,
        name,
        muscle,
        equipment: EQUIPMENT[eq] ?? "Outros",
        secondary: sec
          .split(",")
          .map((s) => s.trim())
          .filter(isMuscleId),
      });
    }
  }
  return out;
}

export const EXERCISES: Exercise[] = parse();

export const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
);

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
