import { Link } from "@tanstack/react-router";
import {
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts";
import { goalMilestones, goalProgress } from "@/lib/fitness-estimates";
import type { Profile, WeightLog } from "@/lib/types";

const tick = { fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" };

export function BodyGoalChart({
  profile,
  weightHistory,
}: {
  profile: Profile;
  weightHistory: WeightLog[];
}) {
  const current = profile.weight;
  const target = profile.targetWeight;
  if (!current || profile.goal === "manter" || !target) {
    return (
      <section className="panel space-y-3 p-5 animate-rise">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Meta corporal
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold">Evolução por etapas</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {profile.goal === "manter"
            ? "Seu objetivo atual é manter o peso. Se mudar de meta, o histórico mostra o caminho em passos de até 5 kg."
            : "Defina um peso-meta no seu perfil para acompanhar uma etapa de cada vez."}
        </p>
        <Link to="/perfil" className="inline-flex text-xs font-medium text-primary">
          Editar perfil →
        </Link>
      </section>
    );
  }

  const history = [...weightHistory].sort((a, b) => a.date.localeCompare(b.date));
  const start = profile.goalStartWeight ?? history[0]?.weight ?? current;
  const milestones = goalMilestones(start, target);
  const progress = goalProgress(start, current, target);
  const lossGoal = target < start;
  const passed = (milestone: number) => (lossGoal ? current <= milestone : current >= milestone);
  const chartData = history.map((entry) => ({
    label: new Date(`${entry.date}T12:00:00`).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    }),
    weight: entry.weight,
  }));
  if (!chartData.length || chartData.at(-1)?.weight !== current) {
    chartData.push({ label: "Agora", weight: current });
  }
  const values = [...chartData.map((entry) => entry.weight), target];
  const min = Math.floor(Math.min(...values) - 2);
  const max = Math.ceil(Math.max(...values) + 2);

  return (
    <section className="panel space-y-4 p-5 animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Meta corporal · etapas de 5 kg
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold">
            Seu caminho até {target.toLocaleString("pt-BR")} kg
          </h2>
        </div>
        <span className="num rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs">
          {progress}%
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Agora</p>
          <p className="num text-2xl font-semibold">{current.toLocaleString("pt-BR")} kg</p>
        </div>
        <div className="pb-1 text-xs text-muted-foreground">
          {lossGoal ? "Meta gradual" : "Crescimento gradual"}
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Objetivo</p>
          <p className="num text-2xl font-semibold">{target.toLocaleString("pt-BR")} kg</p>
        </div>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label="Progresso até o peso-meta"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-silver-gradient transition-[width] duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="-mx-2 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} tick={tick} />
            <YAxis domain={[min, max]} tickLine={false} axisLine={false} tick={tick} width={42} />
            <ReferenceLine
              y={target}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              label={{ value: "meta", fill: "var(--muted-foreground)", fontSize: 9 }}
            />
            <Tooltip
              cursor={{ stroke: "var(--border)" }}
              formatter={(value) => [`${value} kg`, "Peso"]}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 11,
              }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Próximos marcos
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {milestones.map((milestone, index) => (
            <span
              key={`${milestone}-${index}`}
              className={`rounded-full border px-3 py-1 text-xs ${passed(milestone) ? "border-white/25 bg-white/[0.12] text-foreground" : "border-white/10 text-muted-foreground"}`}
            >
              {passed(milestone) ? "✓ " : ""}
              {milestone.toLocaleString("pt-BR")} kg
            </span>
          ))}
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          Uma etapa por vez. O peso varia naturalmente; não há prazo obrigatório para chegar ao
          objetivo.
        </p>
      </div>
    </section>
  );
}
