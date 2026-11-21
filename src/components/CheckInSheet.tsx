import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { MUSCLE_LIST, type MuscleId } from "@/lib/muscles";
import { actions, uid } from "@/lib/store";
import type { Soreness } from "@/lib/types";
import { cn } from "@/lib/utils";

const SORE_LABELS = ["Sem dor", "Leve", "Moderada", "Forte"];

function Scale({
  value,
  onChange,
  low,
  high,
}: {
  value: number;
  onChange: (v: number) => void;
  low: string;
  high: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "num h-11 rounded-xl border text-sm font-semibold transition-all",
              value === n
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

export function CheckInSheet({ children, focus }: { children: ReactNode; focus?: MuscleId }) {
  const [open, setOpen] = useState(false);
  const [fatigue, setFatigue] = useState(2);
  const [energy, setEnergy] = useState(4);
  const [soreness, setSoreness] = useState<Partial<Record<MuscleId, Soreness>>>({});

  const save = () => {
    actions.addCheckIn({ id: uid(), date: new Date().toISOString(), fatigue, energy, soreness });
    toast.success("Check-in salvo", { description: "As estimativas foram ajustadas." });
    setOpen(false);
  };

  const list = focus ? MUSCLE_LIST.filter((m) => m.id === focus) : MUSCLE_LIST;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="border-border bg-card">
        <div className="mx-auto max-h-[80vh] w-full max-w-lg overflow-y-auto px-5 pb-8">
          <DrawerHeader className="px-0 text-left">
            <DrawerTitle className="font-display text-xl">Como você está?</DrawerTitle>
            <DrawerDescription>
              Sua percepção ajusta a estimativa de recuperação nas próximas 36 h.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-6">
            <section>
              <div className="mb-2 text-sm font-medium">Fadiga geral</div>
              <Scale value={fatigue} onChange={setFatigue} low="Descansado" high="Exausto" />
            </section>
            <section>
              <div className="mb-2 text-sm font-medium">Disposição</div>
              <Scale value={energy} onChange={setEnergy} low="Sem energia" high="A mil" />
            </section>
            <section>
              <div className="mb-2 text-sm font-medium">Dor muscular</div>
              <div className="space-y-2">
                {list.map((m) => {
                  const v = soreness[m.id] ?? 0;
                  return (
                    <div key={m.id} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">{m.name}</span>
                      <div className="flex gap-1">
                        {SORE_LABELS.map((l, i) => (
                          <button
                            key={l}
                            type="button"
                            title={l}
                            onClick={() => setSoreness((s) => ({ ...s, [m.id]: i as Soreness }))}
                            className={cn(
                              "h-8 rounded-full border px-2.5 text-[11px] transition-colors",
                              v === i
                                ? i === 0
                                  ? "border-primary bg-accent text-accent-foreground"
                                  : "border-rec-mid text-rec-mid"
                                : "border-border text-muted-foreground",
                            )}
                          >
                            {i === 0 ? "0" : l}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            <Button variant="lime" size="xl" className="w-full" onClick={save}>
              Salvar check-in
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
