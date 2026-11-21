import { createFileRoute } from "@tanstack/react-router";
import { Download, RotateCcw, Sparkles, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { PageHeader, SectionTitle } from "@/components/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { sampleWorkouts } from "@/lib/sample";
import { actions, DEFAULT_STATE, useAppState, type AppState } from "@/lib/store";
import type { Experience, NotificationPrefs } from "@/lib/types";
import { cn } from "@/lib/utils";
import { scheduleAnchorDate, suggestedTrainingDays } from "@/lib/training-schedule";

const DESC = "Seus dados, nível de experiência e preferências ajustam a estimativa de recuperação.";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil · MUSCLE RECOVERY" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Perfil · MUSCLE RECOVERY" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const EXPERIENCE: [Experience, string, string][] = [
  ["iniciante", "Iniciante", "< 1 ano"],
  ["intermediario", "Intermediário", "1–3 anos"],
  ["avancado", "Avançado", "3+ anos"],
];
const SPLITS = ["Push / Pull / Legs", "Superior / Inferior", "Full body", "ABC", "ABCD", "Livre"];
const NOTIFS: [keyof Omit<NotificationPrefs, "reminderTime">, string, string][] = [
  ["reminder", "Lembrete de treino", "Um aviso no horário escolhido"],
  ["recovery", "Músculo recuperado", "Quando um grupo chegar a 90 %"],
  ["overload", "Alerta de sobrecarga", "Volume semanal muito alto"],
  ["weekly", "Resumo semanal", "Toda segunda-feira"],
];

function ProfilePage() {
  const app = useAppState();
  const p = app.profile;
  const fileRef = useRef<HTMLInputElement>(null);
  const initials = (p.name || "Atleta")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  const bmi = p.weight && p.height ? p.weight / Math.pow(p.height / 100, 2) : null;
  const scheduleFrequency = p.trainingDays?.length ?? p.weeklyFrequency;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(app, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `muscle-recovery-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup baixado");
  };

  const importData = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<AppState>;
      if (!Array.isArray(parsed.workouts)) throw new Error("invalid");
      actions.replaceAll({
        ...DEFAULT_STATE,
        ...parsed,
        profile: { ...DEFAULT_STATE.profile, ...parsed.profile },
        notifications: { ...DEFAULT_STATE.notifications, ...parsed.notifications },
      } as AppState);
      toast.success("Dados importados", { description: `${parsed.workouts.length} treinos` });
    } catch {
      toast.error("Arquivo inválido", { description: "Use um backup exportado por este app." });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Configurações" title="Perfil" showProfile={false} />

      <section className="panel flex items-center gap-4 p-5 animate-rise">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-lime-gradient font-display text-xl font-semibold text-primary-foreground glow">
          {initials || "A"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg font-semibold">{p.name || "Atleta"}</div>
          <div className="text-xs text-muted-foreground">
            {app.workouts.length} treinos · {app.checkIns.length} check-ins · {app.customExercises.length} exercícios
            próprios
          </div>
        </div>
      </section>

      <section className="panel space-y-4 p-5 animate-rise">
        <SectionTitle>Sobre você</SectionTitle>
        <TextField label="Nome" value={p.name} onChange={(v) => actions.updateProfile({ name: v })} />
        <div className="grid grid-cols-3 gap-2">
          <NumField label="Idade" unit="anos" value={p.age} onChange={(v) => actions.updateProfile({ age: v })} />
          <NumField label="Peso" unit="kg" value={p.weight} onChange={(v) => actions.updateProfile({ weight: v })} />
          <NumField
            label="Altura"
            unit="cm"
            value={p.height}
            onChange={(v) => actions.updateProfile({ height: v })}
          />
        </div>
        {bmi && (
          <p className="text-xs text-muted-foreground">
            IMC <span className="num text-foreground">{bmi.toFixed(1).replace(".", ",")}</span>
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">
          Idade e experiência mudam o tempo de recuperação estimado. Salvo automaticamente.
        </p>
      </section>

      <section className="panel space-y-4 p-5 animate-rise">
        <SectionTitle>Treino</SectionTitle>
        <div>
          <Label>Experiência</Label>
          <div className="grid grid-cols-3 gap-2">
            {EXPERIENCE.map(([v, l, d]) => (
              <button
                key={v}
                onClick={() => actions.updateProfile({ experience: v })}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-colors",
                  p.experience === v ? "border-primary bg-accent" : "border-border",
                )}
              >
                <div className="text-sm font-medium">{l}</div>
                <div className="text-[11px] text-muted-foreground">{d}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Treinos por semana</Label>
          <div className="grid grid-cols-7 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                onClick={() =>
                  actions.updateProfile({
                    weeklyFrequency: n,
                    trainingDays: suggestedTrainingDays(n),
                    trainingScheduleStart: scheduleAnchorDate(suggestedTrainingDays(n), new Date()),
                  })
                }
                className={cn(
                  "num h-11 rounded-xl border text-sm font-semibold transition-colors",
                  scheduleFrequency === n
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Ao mudar a frequência, o app sugere dias. Personalize os dias na página Treinos.
          </p>
        </div>
        <div>
          <Label>Divisão</Label>
          <div className="flex flex-wrap gap-2">
            {SPLITS.map((s) => (
              <button
                key={s}
                onClick={() =>
                  actions.updateProfile({
                    split: s,
                    trainingScheduleStart: scheduleAnchorDate(p.trainingDays, new Date()),
                  })
                }
                className={cn(
                  "h-9 rounded-full border px-4 text-sm transition-colors",
                  p.split === s ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-5 animate-rise">
        <SectionTitle>Alertas</SectionTitle>
        <ul className="divide-y divide-border/60">
          {NOTIFS.map(([k, l, d]) => (
            <li key={k} className="flex items-center justify-between gap-4 py-3">
              <div>
                <div className="text-sm">{l}</div>
                <div className="text-xs text-muted-foreground">{d}</div>
              </div>
              <div className="flex items-center gap-2">
                {k === "reminder" && app.notifications.reminder && (
                  <input
                    type="time"
                    value={app.notifications.reminderTime}
                    onChange={(e) => actions.updateNotifications({ reminderTime: e.target.value })}
                    className="num rounded-lg border border-border bg-surface px-2 py-1 text-xs outline-none [color-scheme:dark]"
                  />
                )}
                <Switch
                  checked={app.notifications[k]}
                  onCheckedChange={(v) => actions.updateNotifications({ [k]: v })}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel space-y-2 p-5 animate-rise">
        <SectionTitle>Seus dados</SectionTitle>
        <p className="mb-2 text-xs text-muted-foreground">
          Tudo fica salvo só neste aparelho. Faça backup para não perder ao trocar de celular.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="chip" size="pill" onClick={exportData}>
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button variant="chip" size="pill" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Importar
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importData(f);
            e.target.value = "";
          }}
        />
        <Button
          variant="chip"
          size="pill"
          className="w-full"
          onClick={() => {
            actions.replaceAll({ ...app, workouts: sampleWorkouts() });
            toast.success("Dados de exemplo carregados");
          }}
        >
          <Sparkles className="h-4 w-4" /> Carregar exemplo
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="pill" className="w-full text-destructive">
              <RotateCcw className="h-4 w-4" /> Apagar tudo
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-border bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar todos os dados?</AlertDialogTitle>
              <AlertDialogDescription>
                Treinos, check-ins, perfil e exercícios próprios serão removidos deste aparelho. Não dá para desfazer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  actions.reset();
                  toast("Dados apagados");
                }}
              >
                Apagar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{children}</div>;
}

const inputCls =
  "h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary";

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Seu nome" className={inputCls} />
    </label>
  );
}

function NumField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={value ?? ""}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(e.target.value === "" || Number.isNaN(n) ? null : n);
          }}
          className={cn(inputCls, "num pr-10")}
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-muted-foreground">
          {unit}
        </span>
      </div>
    </label>
  );
}
