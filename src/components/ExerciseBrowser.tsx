import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAllExercises } from "@/hooks/use-engine";
import { normalize, type Equipment, type Exercise } from "@/lib/exercises";
import { MUSCLES, MUSCLE_LIST, type MuscleId } from "@/lib/muscles";
import { cn } from "@/lib/utils";

const EQUIPS: Equipment[] = [
  "Barra",
  "Halteres",
  "Máquina",
  "Cabo",
  "Peso corporal",
  "Smith",
  "Kettlebell",
  "Elástico",
  "Anilha",
  "Outros",
];

export function ExerciseBrowser({
  onPick,
  initialMuscle,
  renderAction,
}: {
  onPick: (e: Exercise) => void;
  initialMuscle?: MuscleId | "all";
  renderAction?: (e: Exercise) => React.ReactNode;
}) {
  const all = useAllExercises();
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<MuscleId | "all">(initialMuscle ?? "all");
  const [equip, setEquip] = useState<Equipment | "all">("all");

  const list = useMemo(() => {
    const nq = normalize(q.trim());
    return all.filter(
      (e) =>
        (muscle === "all" || e.muscle === muscle || e.secondary.includes(muscle)) &&
        (equip === "all" || e.equipment === equip) &&
        (!nq || normalize(e.name).includes(nq)),
    ).sort((a, b) => {
      if (muscle !== "all") {
        const pa = a.muscle === muscle ? 0 : 1;
        const pb = b.muscle === muscle ? 0 : 1;
        if (pa !== pb) return pa - pb;
      }
      return a.name.localeCompare(b.name, "pt-BR");
    });
  }, [all, q, muscle, equip]);

  return (
    <div className="flex min-h-0 flex-col">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Buscar entre ${all.length} exercícios`}
          className="h-12 w-full rounded-full border border-border bg-surface pr-10 pl-11 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            aria-label="Limpar busca"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-none">
        <Chip active={muscle === "all"} onClick={() => setMuscle("all")}>
          Todos
        </Chip>
        {MUSCLE_LIST.map((m) => (
          <Chip key={m.id} active={muscle === m.id} onClick={() => setMuscle(m.id)}>
            {m.name}
          </Chip>
        ))}
      </div>
      <div className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-none">
        <Chip small active={equip === "all"} onClick={() => setEquip("all")}>
          Qualquer equipamento
        </Chip>
        {EQUIPS.map((e) => (
          <Chip small key={e} active={equip === e} onClick={() => setEquip(e)}>
            {e}
          </Chip>
        ))}
      </div>
      <div className="mt-3 mb-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <span className="num">{list.length}</span> resultados
      </div>
      <ul className="divide-y divide-border/60">
        {list.map((e) => (
          <li key={e.id} className="flex items-center gap-3 py-3">
            <button className="min-w-0 flex-1 text-left" onClick={() => onPick(e)}>
              <div className="truncate text-sm font-medium">{e.name}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                <span className="text-primary">{MUSCLES[e.muscle].name}</span>
                {e.secondary.length > 0 && ` · ${e.secondary.map((s) => MUSCLES[s].short).join(", ")}`}
                {` · ${e.equipment}`}
              </div>
            </button>
            {renderAction?.(e)}
          </li>
        ))}
        {list.length === 0 && (
          <li className="py-10 text-center text-sm text-muted-foreground">Nenhum exercício encontrado.</li>
        )}
      </ul>
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border whitespace-nowrap transition-colors",
        small ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
        active
          ? "border-primary bg-accent text-accent-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
