import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  Check,
  ChevronRight,
  Clock3,
  Plus,
  RotateCcw,
  Timer,
  Volume2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CARDIO_ACTIVITY_OPTIONS,
  formatTimer,
  remindersCrossed,
  type CardioPreset,
  type CardioReminder,
} from "@/lib/cardio-timer";
import { actions, uid } from "@/lib/store";
import type { CardioActivity } from "@/lib/types";
import { cn } from "@/lib/utils";

type NotificationState = NotificationPermission | "unsupported";

export function CardioTimer({ preset, visible }: { preset?: CardioPreset | undefined; visible: boolean }) {
  const [activity, setActivity] = useState<CardioActivity>(preset?.activity ?? "Corrida");
  const [durationMinutes, setDurationMinutes] = useState(preset?.minutes ?? 45);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [reminders, setReminders] = useState<CardioReminder[]>([]);
  const [reminderMinute, setReminderMinute] = useState(12);
  const [reminderMessage, setReminderMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [notificationState, setNotificationState] = useState<NotificationState>("default");
  const startedAtRef = useRef<number | null>(null);
  const appliedPresetRef = useRef<string | null>(null);
  const lastTickRef = useRef(0);
  const firedRef = useRef(new Set<string>());
  const audioRef = useRef<AudioContext | null>(null);
  const notificationRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const durationSeconds = durationMinutes * 60;
  const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
  const progress =
    durationSeconds > 0 ? Math.min(100, (elapsedSeconds / durationSeconds) * 100) : 0;

  useEffect(() => {
    if ("Notification" in window) setNotificationState(Notification.permission);
    else setNotificationState("unsupported");

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          notificationRegistrationRef.current = registration;
        })
        .catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!preset) return;
    const key = `${preset.nonce}:${preset.activity}:${preset.minutes}`;
    if (appliedPresetRef.current === key) return;
    appliedPresetRef.current = key;
    startedAtRef.current = null;
    lastTickRef.current = 0;
    firedRef.current.clear();
    setActivity(preset.activity);
    setDurationMinutes(preset.minutes);
    setElapsedSeconds(0);
    setRunning(false);
    setReminders([]);
    setReminderMinute(Math.min(12, Math.max(1, preset.minutes - 1)));
    setSaved(false);
  }, [preset]);

  const playChime = useCallback(() => {
    const context = audioRef.current;
    if (!context) return;
    void context.resume().then(() => {
      [0, 0.26, 0.52].forEach((offset, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startAt = context.currentTime + offset;
        oscillator.type = "sine";
        oscillator.frequency.value = index === 1 ? 1046 : 880;
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.2);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.22);
      });
    });
  }, []);

  const notify = useCallback((title: string, body: string) => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }
    const options: NotificationOptions = {
      body,
      icon: "/favicon.svg?v=2",
      tag: "muscle-recovery-cardio",
    };
    const registration = notificationRegistrationRef.current;
    if (registration) {
      void registration.showNotification(title, options).catch(() => {
        try {
          new Notification(title, options);
        } catch {
          // Some mobile browsers only allow notifications from an installed web app.
        }
      });
      return;
    }
    try {
      new Notification(title, options);
    } catch {
      // Some mobile browsers only allow notifications from an installed web app.
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const startedAt = startedAtRef.current ?? Date.now();
      const nextElapsed = Math.min(Math.floor((Date.now() - startedAt) / 1000), durationSeconds);
      const reached = remindersCrossed(
        lastTickRef.current,
        nextElapsed,
        reminders,
        firedRef.current,
      );
      for (const reminder of reached) {
        firedRef.current.add(reminder.id);
        playChime();
        toast(reminder.message, {
          description: `Minuto ${reminder.minute} do cardio · ${activity}`,
        });
        notify("Lembrete de cardio", reminder.message);
      }
      lastTickRef.current = nextElapsed;
      setElapsedSeconds(nextElapsed);
      if (nextElapsed >= durationSeconds) {
        setRunning(false);
        startedAtRef.current = null;
        playChime();
        toast.success("Cardio concluído", { description: `${activity} · ${durationMinutes} min` });
        notify("Cardio concluído", `${activity} · ${durationMinutes} minutos. Mandou bem!`);
      }
    };
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [activity, durationMinutes, durationSeconds, notify, playChime, reminders, running]);

  const startTimer = () => {
    if (elapsedSeconds >= durationSeconds) return;
    try {
      if ("AudioContext" in window) {
        audioRef.current ??= new AudioContext();
        void audioRef.current.resume();
      }
    } catch {
      // The visual timer still works when audio is unavailable.
    }
    startedAtRef.current = Date.now() - elapsedSeconds * 1000;
    lastTickRef.current = elapsedSeconds;
    setRunning(true);
  };

  const pauseTimer = () => {
    if (startedAtRef.current !== null) {
      const pausedAt = Math.min(
        Math.floor((Date.now() - startedAtRef.current) / 1000),
        durationSeconds,
      );
      setElapsedSeconds(pausedAt);
      lastTickRef.current = pausedAt;
      startedAtRef.current = null;
    }
    setRunning(false);
  };

  const resetTimer = () => {
    setRunning(false);
    startedAtRef.current = null;
    lastTickRef.current = 0;
    firedRef.current.clear();
    setElapsedSeconds(0);
    setSaved(false);
  };

  const addReminder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = reminderMessage.trim();
    const minute = reminderMinute;
    if (!message) {
      toast.error("Escreva o que você quer lembrar.");
      return;
    }
    if (!Number.isInteger(minute) || minute < 1 || minute >= durationMinutes) {
      toast.error(`Escolha um minuto entre 1 e ${durationMinutes - 1}.`);
      return;
    }
    if (minute * 60 <= elapsedSeconds) {
      toast.error("Esse minuto já passou. Escolha um minuto futuro do timer.");
      return;
    }
    setReminders((current) =>
      [...current, { id: uid(), minute, message }].sort((a, b) => a.minute - b.minute),
    );
    setReminderMessage("");
  };

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      setNotificationState("unsupported");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationState(permission);
      if (permission === "granted") {
        toast.success("Notificações ativadas");
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.register("/sw.js");
          notificationRegistrationRef.current = registration;
        }
      } else if (permission === "denied") {
        toast.error("Notificações bloqueadas", {
          description: "Ative-as nas configurações do navegador.",
        });
      }
    } catch {
      toast.error("Não foi possível ativar as notificações neste navegador.");
    }
  };

  const saveSession = () => {
    if (saved) return;
    const currentElapsed =
      running && startedAtRef.current !== null
        ? Math.min(Math.floor((Date.now() - startedAtRef.current) / 1000), durationSeconds)
        : elapsedSeconds;
    if (currentElapsed < 1) return;
    if (running) {
      setElapsedSeconds(currentElapsed);
      lastTickRef.current = currentElapsed;
      startedAtRef.current = null;
      setRunning(false);
    }
    actions.addWorkout({
      id: uid(),
      kind: "quick",
      date: new Date().toISOString(),
      entries: [],
      cardio: { activity, durationSeconds: currentElapsed },
    });
    setSaved(true);
    toast.success("Cardio salvo no histórico", {
      description: `${activity} · ${Math.max(1, Math.round(currentElapsed / 60))} min`,
    });
  };

  if (!visible) {
    if (!running) return null;
    return (
      <div className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-lg">
        <Link
          to="/cardio"
          aria-label={`Voltar ao timer de cardio. ${formatTimer(remainingSeconds)} restantes.`}
          className="panel flex items-center gap-3 border-primary/50 bg-background/95 p-3 shadow-xl backdrop-blur"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-primary">
            <Timer className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold">Cardio em andamento</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {activity} · faltam {formatTimer(remainingSeconds)}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
        </Link>
      </div>
    );
  }

  return (
    <section id="cardio-timer" className="panel space-y-4 p-5 animate-rise">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
          <Timer className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-semibold">Timer de cardio</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Monte seu tempo e receba lembretes no minuto certo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          Atividade
          <select
            value={activity}
            disabled={running}
            onChange={(event) => setActivity(event.target.value as CardioActivity)}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm normal-case tracking-normal text-foreground outline-none focus:border-primary disabled:opacity-60"
          >
            {CARDIO_ACTIVITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          Duração · min
          <input
            type="number"
            min={1}
            max={180}
            step={1}
            value={durationMinutes}
            disabled={running || elapsedSeconds > 0}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isFinite(value)) {
                const next = Math.min(180, Math.max(1, Math.floor(value)));
                setDurationMinutes(next);
                setReminderMinute((minute) => Math.min(minute, Math.max(1, next - 1)));
              }
            }}
            className="num h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-foreground outline-none focus:border-primary disabled:opacity-60"
          />
        </label>
      </div>

      <div className="rounded-2xl bg-surface-2 p-4 text-center">
        <div className="mb-2 flex items-center justify-center gap-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <Clock3 className="h-3 w-3" />{" "}
          {running
            ? "Tempo restante"
            : elapsedSeconds >= durationSeconds
              ? "Concluído"
              : "Pronto para começar"}
        </div>
        <div
          className="num font-display text-5xl font-semibold tabular-nums text-foreground"
          aria-live="polite"
        >
          {formatTimer(remainingSeconds)}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-lime-gradient transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">
          Decorrido {formatTimer(elapsedSeconds)} de {formatTimer(durationSeconds)}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button
          variant={running ? "chip" : "lime"}
          size="xl"
          onClick={running ? pauseTimer : startTimer}
          disabled={!running && elapsedSeconds >= durationSeconds}
        >
          {running ? "Pausar" : elapsedSeconds > 0 ? "Continuar" : "Começar cardio"}
        </Button>
        <Button variant="chip" size="xl" aria-label="Zerar timer" onClick={resetTimer}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-2xl border border-border/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bell className="h-4 w-4 text-primary" /> Lembretes do treino
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Ex.: minuto 12 · beber água ou ajustar o ritmo.
            </p>
          </div>
        </div>
        <form onSubmit={addReminder} className="grid grid-cols-[76px_minmax(0,1fr)_40px] gap-2">
          <label className="sr-only" htmlFor="cardio-reminder-minute">
            Minuto do lembrete
          </label>
          <input
            id="cardio-reminder-minute"
            type="number"
            min={1}
            max={Math.max(1, durationMinutes - 1)}
            value={reminderMinute}
            disabled={running}
            onChange={(event) => setReminderMinute(Number(event.target.value))}
            className="num h-10 min-w-0 rounded-xl border border-border bg-surface px-2 text-center text-sm outline-none focus:border-primary disabled:opacity-60"
            aria-label="Minuto do lembrete"
          />
          <label className="sr-only" htmlFor="cardio-reminder-message">
            Texto do lembrete
          </label>
          <input
            id="cardio-reminder-message"
            value={reminderMessage}
            disabled={running}
            onChange={(event) => setReminderMessage(event.target.value)}
            placeholder="O que lembrar?"
            maxLength={80}
            className="h-10 min-w-0 rounded-xl border border-border bg-surface px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={running}
            aria-label="Adicionar lembrete"
            className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
        {reminders.length > 0 && (
          <ul className="mt-3 space-y-2">
            {reminders.map((reminder) => (
              <li
                key={reminder.id}
                className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2"
              >
                <span className="num shrink-0 text-xs font-semibold text-primary">
                  Min {reminder.minute}
                </span>
                <span className="min-w-0 flex-1 text-xs">{reminder.message}</span>
                {firedRef.current.has(reminder.id) && (
                  <Check className="h-3.5 w-3.5 text-primary" aria-label="Lembrete enviado" />
                )}
                <button
                  type="button"
                  disabled={running}
                  aria-label={`Remover lembrete do minuto ${reminder.minute}`}
                  onClick={() =>
                    setReminders((current) => current.filter((item) => item.id !== reminder.id))
                  }
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    running && "invisible",
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/70 p-3">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <Volume2 className="h-4 w-4 shrink-0 text-primary" /> Som nos lembretes quando o app
          estiver aberto
        </div>
        {notificationState === "granted" ? (
          <span className="flex items-center gap-1 text-[11px] text-primary">
            <Check className="h-3.5 w-3.5" /> Notificações ativas
          </span>
        ) : notificationState === "unsupported" ? (
          <span className="text-[11px] text-muted-foreground">Notificações indisponíveis</span>
        ) : notificationState === "denied" ? (
          <span className="text-[11px] text-muted-foreground">
            Ative nas configurações do navegador
          </span>
        ) : (
          <button
            type="button"
            onClick={enableNotifications}
            className="text-xs font-medium text-primary hover:underline"
          >
            Ativar notificações
          </button>
        )}
      </div>
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        No iPhone, adicione o app à Tela de Início e permita notificações. Se o sistema suspender o
        navegador, um aviso pode chegar com atraso.
      </p>

      <Button
        variant="chip"
        size="pill"
        className="w-full"
        disabled={elapsedSeconds < 1 || saved}
        onClick={saveSession}
      >
        {saved ? (
          <>
            <Check className="h-4 w-4" /> Cardio salvo no histórico
          </>
        ) : (
          "Salvar cardio no histórico"
        )}
      </Button>
    </section>
  );
}
