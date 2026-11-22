import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Clock,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyAccess, forgetAccessCache } from "@/lib/access";
import {
  decideAccessRequest,
  devLock,
  devStatus,
  devUnlock,
  listAccessRequests,
  type AccessRequestRow,
  type AccessStatus,
} from "@/lib/access.functions";
import { cn } from "@/lib/utils";

const DESC = "Entre ou peça acesso ao MUSCLE RECOVERY. Novas contas são liberadas pelo desenvolvedor.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · MUSCLE RECOVERY" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Entrar · MUSCLE RECOVERY" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Tab = "conta" | "dev";

function AuthPage() {
  const [tab, setTab] = useState<Tab>("conta");

  return (
    <div className="flex min-h-screen flex-col pt-10 pb-10">
      <header className="mb-8 flex flex-col items-center text-center animate-rise">
        <img src="/favicon.svg?v=2" alt="" className="h-16 w-16 rounded-2xl glow" />
        <h1 className="mt-5 font-display text-xl font-semibold tracking-[0.18em]">MUSCLE RECOVERY</h1>
        <p className="mt-2 text-xs text-muted-foreground">Acesso liberado só para contas aprovadas.</p>
      </header>

      <div role="tablist" className="mb-5 grid grid-cols-2 gap-1 rounded-full border border-border bg-surface p-1">
        <TabButton active={tab === "conta"} onClick={() => setTab("conta")} icon={<UserRound className="h-4 w-4" />}>
          Minha conta
        </TabButton>
        <TabButton active={tab === "dev"} onClick={() => setTab("dev")} icon={<KeyRound className="h-4 w-4" />}>
          Desenvolvedor
        </TabButton>
      </div>

      {tab === "conta" ? <AccountPanel /> : <DevPanel />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex h-10 items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors",
        active ? "bg-lime-gradient text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/* ---------------- Account: sign in / sign up / pending ---------------- */

function AccountPanel() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const access = useQuery({ queryKey: ["my-access"], queryFn: fetchMyAccess });

  useEffect(() => {
    if (access.data?.status === "approved") void navigate({ to: "/", replace: true });
  }, [access.data?.status, navigate]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        forgetAccessCache();
        void queryClient.invalidateQueries({ queryKey: ["my-access"] });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  if (access.isLoading) {
    return (
      <div className="panel grid place-items-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (access.data) {
    return (
      <PendingCard
        email={access.data.email}
        status={access.data.status}
        checking={access.isFetching}
        onCheck={() => {
          forgetAccessCache();
          void access.refetch();
        }}
      />
    );
  }

  return <CredentialsForm />;
}

function CredentialsForm() {
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) setError(friendlyError(error.message));
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) setError(friendlyError(error.message));
        else if (!data.session) toast("Conta criada. Confirme pelo link no seu e-mail.");
        else toast.success("Pedido de acesso enviado");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-5 animate-rise">
      <div>
        <h2 className="font-display text-lg font-semibold">{mode === "entrar" ? "Entrar" : "Pedir acesso"}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "entrar"
            ? "Use o e-mail e a senha da sua conta."
            : "Crie sua conta. Ela fica pendente até o desenvolvedor liberar."}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          className="h-12 rounded-xl bg-surface"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "entrar" ? "current-password" : "new-password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          className="h-12 rounded-xl bg-surface"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" variant="lime" size="xl" className="w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "entrar" ? "Entrar" : "Criar conta e pedir acesso"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "entrar" ? "criar" : "entrar");
          setError(null);
        }}
        className="block w-full text-center text-xs text-muted-foreground"
      >
        {mode === "entrar" ? (
          <>
            Ainda não tem conta? <span className="text-primary">Criar conta</span>
          </>
        ) : (
          <>
            Já tem conta? <span className="text-primary">Entrar</span>
          </>
        )}
      </button>
    </form>
  );
}

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Esse e-mail já tem conta. Use “Entrar”.";
  if (m.includes("pwned") || m.includes("weak")) return "Essa senha é fraca ou já vazou. Escolha outra.";
  if (m.includes("rate limit")) return "Muitas tentativas. Espere um pouco e tente de novo.";
  return message;
}

function PendingCard({
  email,
  status,
  checking,
  onCheck,
}: {
  email: string;
  status: AccessStatus;
  checking: boolean;
  onCheck: () => void;
}) {
  const rejected = status === "rejected";
  return (
    <section className="panel relative overflow-hidden p-6 text-center animate-rise">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <span
        className={cn(
          "relative mx-auto grid h-14 w-14 place-items-center rounded-full",
          rejected ? "bg-destructive/15 text-destructive" : "bg-accent text-primary",
        )}
      >
        {rejected ? <ShieldX className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
      </span>
      <h2 className="relative mt-4 font-display text-lg font-semibold">
        {rejected ? "Acesso recusado" : "Aguardando liberação"}
      </h2>
      <p className="relative mt-2 text-sm text-muted-foreground">
        {rejected
          ? "O desenvolvedor não liberou esta conta."
          : "Seu pedido foi enviado. Assim que o desenvolvedor confirmar, você entra no app."}
      </p>
      <p className="relative mt-3 truncate text-xs text-muted-foreground">{email}</p>
      <div className="relative mt-5 grid gap-2">
        {!rejected && (
          <Button variant="lime" size="pill" onClick={onCheck} disabled={checking}>
            <RefreshCw className={cn("h-4 w-4", checking && "animate-spin")} /> Verificar liberação
          </Button>
        )}
        <Button
          variant="chip"
          size="pill"
          onClick={async () => {
            forgetAccessCache();
            await supabase.auth.signOut();
          }}
        >
          <LogOut className="h-4 w-4" /> Sair e usar outra conta
        </Button>
      </div>
    </section>
  );
}

/* ---------------- Developer access ---------------- */

function DevPanel() {
  const queryClient = useQueryClient();
  const getStatus = useServerFn(devStatus);
  const status = useQuery({ queryKey: ["dev-status"], queryFn: () => getStatus() });

  if (status.isLoading) {
    return (
      <div className="panel grid place-items-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!status.data?.unlocked) {
    return <DevUnlockForm onUnlocked={() => queryClient.invalidateQueries({ queryKey: ["dev-status"] })} />;
  }
  return <DevRequests />;
}

function DevUnlockForm({ onUnlocked }: { onUnlocked: () => void }) {
  const unlock = useServerFn(devUnlock);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const res = await unlock({ data: { password } });
      if (res.ok) onUnlocked();
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-5 animate-rise">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold">Acesso para desenvolvedor</h2>
          <p className="mt-1 text-xs text-muted-foreground">Digite a senha para liberar os pedidos de acesso.</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="dev-password">Senha do desenvolvedor</Label>
        <Input
          id="dev-password"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="num h-12 rounded-xl bg-surface text-center text-lg tracking-[0.4em]"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Senha incorreta.
        </p>
      )}
      <Button type="submit" variant="lime" size="xl" className="w-full" disabled={busy || !password}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Entrar como desenvolvedor
      </Button>
    </form>
  );
}

function DevRequests() {
  const queryClient = useQueryClient();
  const list = useServerFn(listAccessRequests);
  const decide = useServerFn(decideAccessRequest);
  const lock = useServerFn(devLock);
  const requests = useQuery({ queryKey: ["access-requests"], queryFn: () => list(), refetchInterval: 15_000 });

  const mutation = useMutation({
    mutationFn: (v: { userId: string; status: AccessStatus }) => decide({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(
        v.status === "approved" ? "Acesso confirmado" : v.status === "rejected" ? "Pedido recusado" : "Acesso bloqueado",
      );
      void queryClient.invalidateQueries({ queryKey: ["access-requests"] });
    },
    onError: () => toast.error("Não deu para salvar. Tente de novo."),
  });

  const rows = requests.data ?? [];
  const pending = rows.filter((r) => r.status === "pending");
  const decided = rows.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-5 animate-rise">
      <section className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Pedidos pendentes
          </h2>
          <span className="num rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">{pending.length}</span>
        </div>
        {requests.isLoading ? (
          <div className="grid place-items-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : pending.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum pedido esperando.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {pending.map((r) => (
              <li key={r.user_id} className="py-3">
                <RequestInfo r={r} />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    variant="lime"
                    size="pill"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ userId: r.user_id, status: "approved" })}
                  >
                    <Check className="h-4 w-4" /> Confirmar
                  </Button>
                  <Button
                    variant="chip"
                    size="pill"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ userId: r.user_id, status: "rejected" })}
                  >
                    <X className="h-4 w-4" /> Recusar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {decided.length > 0 && (
        <section className="panel p-5">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Já decididos
          </h2>
          <ul className="divide-y divide-border/60">
            {decided.map((r) => (
              <li key={r.user_id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <RequestInfo r={r} />
                </div>
                <Button
                  variant="chip"
                  size="sm"
                  className="shrink-0 rounded-full"
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate({ userId: r.user_id, status: r.status === "approved" ? "rejected" : "approved" })
                  }
                >
                  {r.status === "approved" ? "Bloquear" : "Liberar"}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Button
        variant="ghost"
        size="pill"
        className="w-full text-muted-foreground"
        onClick={async () => {
          await lock();
          void queryClient.invalidateQueries({ queryKey: ["dev-status"] });
        }}
      >
        <LogOut className="h-4 w-4" /> Sair do modo desenvolvedor
      </Button>
    </div>
  );
}

function RequestInfo({ r }: { r: AccessRequestRow }) {
  const label = r.status === "approved" ? "Liberado" : r.status === "rejected" ? "Recusado" : "Pendente";
  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-medium">{r.email || "sem e-mail"}</div>
      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            r.status === "approved" ? "bg-primary" : r.status === "rejected" ? "bg-destructive" : "bg-rec-mid",
          )}
        />
        {label} ·{" "}
        {new Date(r.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
