import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Ruler, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState, actions } from "@/lib/store";
import type { ActivityLevel, BodyGoal, BodyMeasurements, CalculationSex } from "@/lib/types";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-12 w-full rounded-2xl border border-white/10 bg-zinc-900/70 px-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-white/40";
const goals: { id: BodyGoal; title: string; detail: string }[] = [
  { id: "manter", title: "Manter", detail: "Continuar no meu ritmo" },
  { id: "emagrecer", title: "Emagrecer", detail: "Reduzir peso aos poucos" },
  { id: "ganhar_massa", title: "Ganhar massa", detail: "Priorizar massa muscular" },
  { id: "ganhar_peso", title: "Ganhar peso", detail: "Aumentar o peso gradualmente" },
];

function numeric(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function OnboardingWizard() {
  const { profile } = useAppState();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => ({
    name: profile.name,
    age: profile.age?.toString() ?? "",
    weight: profile.weight?.toString() ?? "",
    height: profile.height?.toString() ?? "",
    goal: profile.goal ?? "manter",
    targetWeight: profile.targetWeight?.toString() ?? "",
    activityLevel: profile.activityLevel ?? "leve",
    calculationSex: profile.calculationSex ?? "",
    armCm: profile.measurements?.armCm?.toString() ?? "",
    waistCm: profile.measurements?.waistCm?.toString() ?? "",
    chestCm: profile.measurements?.chestCm?.toString() ?? "",
    hipCm: profile.measurements?.hipCm?.toString() ?? "",
  }));

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const weight = numeric(form.weight);
  const targetWeight = numeric(form.targetWeight);

  const validateStep = () => {
    setError("");
    if (step === 0) {
      const age = numeric(form.age);
      const height = numeric(form.height);
      if (!form.name.trim()) return "Digite seu nome para personalizar o perfil.";
      if (!age || age < 10 || age > 100) return "Informe uma idade válida.";
      if (!weight || weight < 30 || weight > 300) return "Informe um peso entre 30 e 300 kg.";
      if (!height || height < 100 || height > 240) return "Informe uma altura entre 100 e 240 cm.";
    }
    if (step === 1 && form.goal !== "manter") {
      if (!weight || !targetWeight || targetWeight < 30 || targetWeight > 300)
        return "Informe um peso-meta entre 30 e 300 kg.";
      if (form.goal === "emagrecer" && targetWeight >= weight)
        return "Para emagrecer, o peso-meta precisa ser menor que o atual.";
      if (form.goal !== "emagrecer" && targetWeight <= weight)
        return "Para ganhar peso ou massa, o peso-meta precisa ser maior que o atual.";
    }
    return "";
  };

  const next = () => {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setStep((current) => Math.min(2, current + 1));
  };

  const finish = () => {
    const age = numeric(form.age);
    const currentWeight = numeric(form.weight);
    const height = numeric(form.height);
    if (!age || !currentWeight || !height) {
      setError("Revise idade, peso e altura antes de salvar.");
      setStep(0);
      return;
    }
    if (form.goal !== "manter" && !targetWeight) {
      setError("Informe o peso-meta antes de salvar.");
      setStep(1);
      return;
    }
    const measurements: BodyMeasurements = {
      armCm: numeric(form.armCm),
      waistCm: numeric(form.waistCm),
      chestCm: numeric(form.chestCm),
      hipCm: numeric(form.hipCm),
    };
    actions.updateProfile({
      name: form.name.trim(),
      age,
      weight: currentWeight,
      height,
      goal: form.goal,
      targetWeight: form.goal === "manter" ? currentWeight : targetWeight,
      goalStartWeight: currentWeight,
      activityLevel: form.activityLevel as ActivityLevel,
      calculationSex: (form.calculationSex || null) as CalculationSex,
      measurements,
      setupComplete: true,
    });
  };

  return (
    <section className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-lg flex-col justify-center py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-primary">
          {[<UserRound key="profile" />, <Dumbbell key="goal" />, <Ruler key="measures" />][step]}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Muscle Recovery · quiz de perfil
          </p>
          <h1 className="font-display text-xl font-semibold">Vamos montar seu perfil</h1>
        </div>
      </div>

      <div className="mb-6 flex gap-2" aria-label={`Etapa ${step + 1} de 3`}>
        {[0, 1, 2].map((item) => (
          <span
            key={item}
            className={cn("h-1 flex-1 rounded-full", item <= step ? "bg-primary" : "bg-white/10")}
          />
        ))}
      </div>

      <div className="panel space-y-5 p-5 sm:p-6">
        {step === 0 && (
          <>
            <div>
              <h2 className="font-display text-lg font-semibold">O básico sobre você</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Isso personaliza o acompanhamento. Seus dados ficam neste aparelho.
              </p>
            </div>
            <Field label="Nome">
              <input
                className={fieldClass}
                autoComplete="given-name"
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder="Como podemos te chamar?"
              />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Idade" unit="anos">
                <input
                  className={fieldClass}
                  type="number"
                  inputMode="numeric"
                  value={form.age}
                  onChange={(event) => set("age", event.target.value)}
                  placeholder="25"
                />
              </Field>
              <Field label="Peso" unit="kg">
                <input
                  className={fieldClass}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.weight}
                  onChange={(event) => set("weight", event.target.value)}
                  placeholder="70"
                />
                <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                  Este peso será usado nas referências de alimentação, proteína e no seu progresso.
                </p>
              </Field>
              <Field label="Altura" unit="cm">
                <input
                  className={fieldClass}
                  type="number"
                  inputMode="numeric"
                  value={form.height}
                  onChange={(event) => set("height", event.target.value)}
                  placeholder="170"
                />
              </Field>
            </div>
            <Field label="Atividade fora dos treinos">
              <select
                className={fieldClass}
                value={form.activityLevel}
                onChange={(event) => set("activityLevel", event.target.value)}
              >
                <option value="sedentario">Mais sentado(a)</option>
                <option value="leve">Leve</option>
                <option value="moderado">Moderada</option>
                <option value="alto">Bem ativa</option>
              </select>
            </Field>
            <Field label="Parâmetro usado na fórmula de calorias (opcional)">
              <select
                className={fieldClass}
                value={form.calculationSex}
                onChange={(event) => set("calculationSex", event.target.value)}
              >
                <option value="">Prefiro não informar</option>
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
              </select>
            </Field>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Se não informar esse parâmetro, o app não estima calorias. A fórmula é aproximada e
              não define uma dieta.
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h2 className="font-display text-lg font-semibold">Qual é seu objetivo?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Metas graduais deixam o progresso mais claro e realista.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {goals.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => set("goal", item.id)}
                  className={cn(
                    "rounded-2xl border p-3 text-left transition-colors",
                    form.goal === item.id
                      ? "border-primary/70 bg-white/[0.08]"
                      : "border-white/10 bg-white/[0.02]",
                  )}
                >
                  <span className="block text-sm font-semibold">{item.title}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {item.detail}
                  </span>
                </button>
              ))}
            </div>
            {form.goal !== "manter" && (
              <Field label="Peso-meta" unit="kg">
                <input
                  className={fieldClass}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.targetWeight}
                  onChange={(event) => set("targetWeight", event.target.value)}
                  placeholder={
                    form.goal === "emagrecer"
                      ? String(Math.max(30, (weight ?? 70) - 5))
                      : String((weight ?? 70) + 5)
                  }
                />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  O histórico vai dividir o caminho em etapas de até 5 kg, sem prazo obrigatório.
                </p>
              </Field>
            )}
            {form.goal === "manter" && (
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-muted-foreground">
                Seu peso atual será a referência. Você poderá mudar o objetivo depois no Perfil.
              </p>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="font-display text-lg font-semibold">Medidas opcionais</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use centímetros. Pode deixar em branco e preencher mais tarde.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Braço" unit="cm">
                <input
                  className={fieldClass}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.armCm}
                  onChange={(event) => set("armCm", event.target.value)}
                  placeholder="—"
                />
              </Field>
              <Field label="Cintura" unit="cm">
                <input
                  className={fieldClass}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.waistCm}
                  onChange={(event) => set("waistCm", event.target.value)}
                  placeholder="—"
                />
              </Field>
              <Field label="Peito" unit="cm">
                <input
                  className={fieldClass}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.chestCm}
                  onChange={(event) => set("chestCm", event.target.value)}
                  placeholder="—"
                />
              </Field>
              <Field label="Quadril" unit="cm">
                <input
                  className={fieldClass}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.hipCm}
                  onChange={(event) => set("hipCm", event.target.value)}
                  placeholder="—"
                />
              </Field>
            </div>
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-muted-foreground">
              O Muscle Recovery não monta cardápios nem substitui orientação profissional.
              Estimativas podem não se aplicar a menores, gestantes, pessoas amamentando ou quem tem
              condições de saúde específicas.
            </p>
          </>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}
        <div className="flex gap-2 pt-1">
          {step > 0 && (
            <Button
              type="button"
              variant="chip"
              size="pill"
              className="flex-1"
              onClick={() => {
                setError("");
                setStep((current) => current - 1);
              }}
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          )}
          {step < 2 ? (
            <Button type="button" variant="silver" size="pill" className="flex-1" onClick={next}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" variant="silver" size="pill" className="flex-1" onClick={finish}>
              <Check className="h-4 w-4" /> Salvar perfil
            </Button>
          )}
        </div>
      </div>
      <p className="mt-5 text-center text-[10px] text-muted-foreground">
        Sem conta, sem sincronização. Seus dados continuam no seu aparelho.
      </p>
    </section>
  );
}

function Field({
  label,
  unit,
  children,
}: {
  label: string;
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
        {unit && <span className="normal-case tracking-normal">{unit}</span>}
      </span>
      {children}
    </label>
  );
}
