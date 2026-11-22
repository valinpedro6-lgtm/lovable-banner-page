import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { devLock } from "@/lib/access.functions";

export function AccountControls() {
  const lockFn = useServerFn(devLock);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      try {
        await lockFn();
      } catch {
        /* A saída da conta deve continuar mesmo se a sessão admin já expirou. */
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await queryClient.clear();
      await navigate({ to: "/auth", replace: true });
    } catch {
      toast.error("Não foi possível sair da conta. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel space-y-3 p-5 animate-rise">
      <h2 className="font-display text-sm font-semibold">Conta e administração</h2>
      <p className="text-xs text-muted-foreground">
        O acesso administrativo é adicional; os dados de treino continuam salvos somente neste
        aparelho.
      </p>
      <Button asChild variant="chip" size="pill" className="w-full">
        <Link to="/dev-access">
          <KeyRound className="h-4 w-4" /> Acesso do desenvolvedor
        </Link>
      </Button>
      <Button
        variant="chip"
        size="pill"
        className="w-full"
        onClick={() => void signOut()}
        disabled={busy}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Sair
        da conta
      </Button>
    </section>
  );
}
