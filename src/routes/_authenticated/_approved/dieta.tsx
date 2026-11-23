import { createFileRoute } from "@tanstack/react-router";
import { Droplets, Minus, Plus, Utensils } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/PageHeader";
import { useAppState, actions } from "@/lib/store";
import {
  goalLabel,
  hydrationGoal,
  maintenanceEnergyEstimate,
  proteinEstimate,
} from "@/lib/fitness-estimates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_approved/dieta")({
  head: () => ({
    meta: [
      { title: "Dieta · MUSCLE RECOVERY" },
      {
        name: "description",
        content: "Estimativas de energia, proteína e controle diário de hidratação.",
      },
      { property: "og:title", content: "Dieta · MUSCLE RECOVERY" },
      {
        property: "og:description",
        content: "Estimativas de energia, proteína e controle diário de hidratação.",
      },
    ],
  }),
  component: DietPage,
});

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function DietPage() {
  const app = useAppState();
  const profile = app.profile;
  const waterGoal = hydrationGoal(profile);
  const waterToday = app.waterIntake[localToday()] ?? 0;
  const waterPct = Math.min(100, Math.round((waterToday / waterGoal) * 100));
  const calories = maintenanceEnergyEstimate(profile);
  const protein = proteinEstimate(profile);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Referências para seu dia" title="Dieta" />

      <section className="panel relative overflow-hidden p-5 animate-rise">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-primary">
            <Utensils className="h-5 w-5" />
          </span>
          <div>
            <SectionTitle>Referências nutricionais</SectionTitle>
            <p className="text-xs text-muted-foreground">Objetivo: {goalLabel(profile.goal)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Manutenção aproximada
            </p>
            {calories ? (
              <>
                <p className="num mt-2 text-2xl font-semibold">
                  ~{calories.toLocaleString("pt-BR")}{" "}
                  <span className="text-xs font-normal">kcal</span>
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Gasto estimado · não é meta alimentar
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Requer idade de 19–78 anos, peso, altura e parâmetro da fórmula no Perfil;
                resultados fora da faixa não são exibidos.
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Proteína diária
            </p>
            {protein ? (
              <>
                <p className="num mt-2 text-2xl font-semibold">
                  {protein.midpoint} <span className="text-xs font-normal">g</span>
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Faixa geral: {protein.min}–{protein.max} g
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Informe peso e idade adulta no Perfil para ver uma faixa.
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          São referências aproximadas, não uma dieta ou prescrição. A estimativa de proteína segue
          uma faixa geral para pessoas saudáveis que treinam; doença renal ou outra condição exige
          orientação profissional. Calorias mostram somente gasto estimado de manutenção, por uma
          equação e fatores simplificados de atividade. O app não aplica déficit ou superávit e não
          transforma o número em meta de consumo.
        </p>
      </section>

      <section className="panel p-5 animate-rise">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-sky-300">
            <Droplets className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <SectionTitle>Água de hoje</SectionTitle>
            <p className="text-xs text-muted-foreground">Acompanhamento local · meta ajustável</p>
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <p className="num text-3xl font-semibold">
            {(waterToday / 1000).toLocaleString("pt-BR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 2,
            })}
            <span className="ml-1 text-sm font-normal text-muted-foreground">L</span>
          </p>
          <p className="text-xs text-muted-foreground">
            meta {(waterGoal / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1 })} L ·{" "}
            {waterPct}%
          </p>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label="Progresso da água de hoje"
          aria-valuenow={waterPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-sky-300 transition-[width] duration-500"
            style={{ width: `${waterPct}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <WaterButton onClick={() => actions.addWater(250)}>
            <Plus className="h-4 w-4" /> 250 ml
          </WaterButton>
          <WaterButton onClick={() => actions.addWater(500)}>
            <Plus className="h-4 w-4" /> 500 ml
          </WaterButton>
          <WaterButton onClick={() => actions.addWater(-250)}>
            <Minus className="h-4 w-4" /> 250 ml
          </WaterButton>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Meta diária</p>
            <p className="text-[10px] text-muted-foreground">
              Ajuste conforme sua orientação pessoal
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Diminuir meta de água"
              onClick={() => actions.updateProfile({ waterGoalMl: Math.max(500, waterGoal - 250) })}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-muted-foreground"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="num min-w-[48px] text-center text-sm">
              {(waterGoal / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1 })} L
            </span>
            <button
              aria-label="Aumentar meta de água"
              onClick={() =>
                actions.updateProfile({ waterGoalMl: Math.min(6000, waterGoal + 250) })
              }
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-muted-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          A meta padrão é apenas um ponto de partida editável. Necessidades variam; referências
          oficiais de água total incluem também a água dos alimentos. Se você recebeu limite de
          líquidos por um profissional, siga essa orientação.
        </p>
      </section>

      <section className="panel space-y-3 p-5 animate-rise">
        <SectionTitle>Transparência</SectionTitle>
        <p className="text-xs leading-relaxed text-muted-foreground">
          As estimativas não são indicadas para menores de 18 anos, gestantes, pessoas amamentando
          ou quem tem condição médica que altere a alimentação ou hidratação. Converse com um
          profissional de saúde antes de usar metas. Nenhum cardápio é montado pelo app.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-primary">
          <a href="https://pubmed.ncbi.nlm.nih.gov/2305711/" target="_blank" rel="noreferrer">
            Equação de energia
          </a>
          <a href="https://pubmed.ncbi.nlm.nih.gov/28642676/" target="_blank" rel="noreferrer">
            Proteína e exercício
          </a>
          <a
            href="https://www.nationalacademies.org/read/10925/chapter/6"
            target="_blank"
            rel="noreferrer"
          >
            Referência de água
          </a>
        </div>
      </section>
    </div>
  );
}

function WaterButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-11 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-medium transition-colors active:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}
