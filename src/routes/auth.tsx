import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Loader2, LogOut, RefreshCw, ShieldCheck, ShieldX } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyAccess } from "@/lib/access";
import { devLock, type AccessStatus } from "@/lib/access.functions";

const DESC =
  "Entre ou peça acesso ao MUSCLE RECOVERY. Novas contas precisam ser liberadas pelo desenvolvedor.";

type AuthMode = "entrar" | "criar" | "esqueci" | "nova-senha";

export const Route = createFileRoute("/auth")({
  ssr: false,
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

function AuthPage() {
  const [isRecovery, setIsRecovery] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("type") === "recovery",
  );

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen flex-col pt-10 pb-10">
      <header className="mb-8 flex flex-col items-center text-center animate-rise">
        <img src="/favicon.svg?v=2" alt="" className="h-16 w-16 rounded-2xl glow" />
        <h1 className="mt-5 font-display text-xl font-semibold tracking-[0.18em]">
          MUSCLE RECOVERY
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">Acesse sua conta ou peça liberação.</p>
      </header>
      <AccountPanel isRecovery={isRecovery} />
    </div>
  );
}

function AccountPanel({ isRecovery }: { isRecovery: boolean }) {
  const navigate = useNavigate();
  const access = useQuery({ queryKey: ["my-access"], queryFn: fetchMyAccess, retry: false });

  useEffect(() => {
    if (!isRecovery && access.data?.status === "approved")
      void navigate({ to: "/", replace: true });
  }, [access.data?.status, isRecovery, navigate]);

  if (isRecovery) return <CredentialsForm recovery />;

  if (access.isLoading) {
    return (
      <div className="panel grid place-items-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (access.isError) {
    return (
      <section className="panel space-y-4 p-5 text-center animate-rise">
        <h2 className="font-display text-lg font-semibold">Não foi possível verificar o acesso</h2>
        <p className="text-sm text-muted-foreground">
          Tente novamente em instantes. Se você é o desenvolvedor, ainda pode abrir a área de acesso
          administrativo.
        </p>
        <Button
          variant="silver"
          size="pill"
          className="w-full"
          onClick={() => void access.refetch()}
        >
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </Button>
        <Button asChild variant="chip" size="pill" className="w-full">
          <Link to="/dev-access">
            <ShieldCheck className="h-4 w-4" /> Sou o desenvolvedor
          </Link>
        </Button>
      </section>
    );
  }

  if (access.data) {
    return (
      <PendingCard
        email={access.data.email}
        status={access.data.status}
        checking={access.isFetching}
        onCheck={() => void access.refetch()}
      />
    );
  }

  return <CredentialsForm />;
}

function CredentialsForm({ recovery = false }: { recovery?: boolean }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AuthMode>(() => (recovery ? "nova-senha" : "entrar"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (recovery) setMode("nova-senha");
  }, [recovery]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (mode !== "esqueci" && password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "entrar") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) setError(friendlyError(signInError.message));
        else await queryClient.invalidateQueries({ queryKey: ["my-access"] });
      } else if (mode === "criar") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpError) setError(friendlyError(signUpError.message));
        else if (!data.session) {
          setNotice(
            "Conta criada. Confirme o endereço pelo link enviado ao seu e-mail e depois entre no app.",
          );
        } else {
          setNotice(
            "Pedido de acesso enviado. Você poderá entrar depois da liberação do desenvolvedor.",
          );
          await queryClient.invalidateQueries({ queryKey: ["my-access"] });
        }
      } else if (mode === "esqueci") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth?type=recovery`,
        });
        if (resetError) setError(friendlyError(resetError.message));
        else
          setNotice(
            "Se houver uma conta para esse e-mail, enviaremos um link para redefinir a senha.",
          );
      } else {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) setError(friendlyError(updateError.message));
        else {
          await supabase.auth.signOut();
          setPassword("");
          setMode("entrar");
          window.history.replaceState(null, "", window.location.pathname);
          setNotice("Senha atualizada. Entre com sua nova senha.");
          await queryClient.invalidateQueries({ queryKey: ["my-access"] });
        }
      }
    } catch {
      setError("Não foi possível concluir agora. Confira sua conexão e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  const passwordMode = mode === "entrar" || mode === "criar" || mode === "nova-senha";
  const title =
    mode === "entrar"
      ? "Entrar"
      : mode === "criar"
        ? "Pedir acesso"
        : mode === "esqueci"
          ? "Redefinir senha"
          : "Criar nova senha";

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-5 animate-rise">
      <div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "entrar"
            ? "Use o e-mail e a senha da sua conta."
            : mode === "criar"
              ? "Crie sua conta; o acesso fica pendente até o desenvolvedor liberar."
              : mode === "esqueci"
                ? "Informe o e-mail da conta para receber o link de redefinição."
                : "Escolha uma nova senha para sua conta."}
        </p>
      </div>

      {mode !== "nova-senha" && (
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
      )}

      {passwordMode && (
        <div className="space-y-2">
          <Label htmlFor="password">{mode === "nova-senha" ? "Nova senha" : "Senha"}</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "entrar" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="h-12 rounded-xl bg-surface"
          />
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted-foreground"
        >
          {notice}
        </p>
      )}

      <Button type="submit" variant="silver" size="xl" className="w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "entrar"
          ? "Entrar"
          : mode === "criar"
            ? "Criar conta e pedir acesso"
            : mode === "esqueci"
              ? "Enviar link"
              : "Salvar nova senha"}
      </Button>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {mode === "entrar" ? (
          <>
            <button
              type="button"
              onClick={() => {
                setMode("criar");
                setError(null);
                setNotice(null);
              }}
            >
              Criar conta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("esqueci");
                setError(null);
                setNotice(null);
              }}
            >
              Esqueci a senha
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode("entrar");
              setError(null);
              setNotice(null);
            }}
          >
            Voltar para entrar
          </button>
        )}
      </div>
    </form>
  );
}

function friendlyError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Esse e-mail já tem conta. Use Entrar.";
  if (m.includes("pwned") || m.includes("weak"))
    return "Essa senha é fraca ou já vazou. Escolha outra.";
  if (m.includes("email not confirmed"))
    return "Confirme o e-mail pelo link enviado antes de entrar.";
  if (m.includes("rate limit")) return "Muitas tentativas. Espere um pouco e tente de novo.";
  return "Não foi possível concluir. Confira os dados e tente novamente.";
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
  const queryClient = useQueryClient();
  const lockFn = useServerFn(devLock);
  return (
    <section className="panel relative overflow-hidden p-6 text-center animate-rise">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <span
        className={`relative mx-auto grid h-14 w-14 place-items-center rounded-full ${rejected ? "bg-destructive/15 text-destructive" : "bg-accent text-primary"}`}
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
          <Button variant="silver" size="pill" onClick={onCheck} disabled={checking}>
            <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} /> Verificar
            liberação
          </Button>
        )}
        <Button asChild variant="chip" size="pill">
          <Link to="/dev-access">
            <ShieldCheck className="h-4 w-4" /> Sou o desenvolvedor
          </Link>
        </Button>
        <Button
          variant="chip"
          size="pill"
          onClick={async () => {
            try {
              await lockFn();
            } catch {
              /* Continue account sign-out if the admin session has expired. */
            }
            await supabase.auth.signOut();
            await queryClient.clear();
          }}
        >
          <LogOut className="h-4 w-4" /> Sair e usar outra conta
        </Button>
      </div>
    </section>
  );
}
