import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { devStatus, devUnlock } from "@/lib/access.functions";

export function DevAccessCard() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const statusFn = useServerFn(devStatus);
  const unlockFn = useServerFn(devUnlock);
  const status = useQuery({ queryKey: ["dev-status"], queryFn: () => statusFn(), retry: false });
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await unlockFn({ data: { password } });
      if (!result.ok) {
        setError(
          result.reason === "unconfigured"
            ? "O modo desenvolvedor ainda não foi configurado com segurança no servidor."
            : result.reason === "locked"
              ? "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente."
              : "Senha de desenvolvedor incorreta.",
        );
        return;
      }
      setPassword("");
      await queryClient.invalidateQueries({ queryKey: ["dev-status"] });
      await router.invalidate();
    } catch {
      setError("Não foi possível validar agora. Confira sua conexão e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  if (status.isPending) {
    return (
      <section className="panel grid place-items-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </section>
    );
  }

  if (status.isError) {
    return (
      <section className="panel p-5 text-sm text-muted-foreground">
        Não foi possível validar sua sessão. Entre novamente e tente outra vez.
      </section>
    );
  }

  if (status.data?.unlocked) {
    return (
      <section className="panel space-y-4 p-5 animate-rise">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display font-semibold">Modo desenvolvedor ativo</h2>
            <p className="text-xs text-muted-foreground">
              Acesso administrativo disponível nesta sessão.
            </p>
          </div>
        </div>
        <Button asChild variant="silver" size="pill" className="w-full">
          <Link to="/admin">Abrir aprovações</Link>
        </Button>
        <Button asChild variant="chip" size="pill" className="w-full">
          <Link to="/">Voltar ao app</Link>
        </Button>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="panel space-y-4 p-5 animate-rise">
      <div>
        <h2 className="font-display text-lg font-semibold">Acesso do desenvolvedor</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Informe a senha administrativa. Ela é validada no servidor e não fica salva no app.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="developer-password">Senha do desenvolvedor</Label>
        <Input
          id="developer-password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-xl bg-surface"
        />
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}
      <Button
        type="submit"
        variant="silver"
        size="pill"
        className="w-full"
        disabled={busy || !password}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        Ativar acesso administrativo
      </Button>
    </form>
  );
}
