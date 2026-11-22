import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, LockKeyhole, RefreshCw, ShieldCheck, ShieldX, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  decideAccessRequest,
  devLock,
  listAccessRequests,
  type DecisionStatus,
} from "@/lib/access.functions";

export function AccessRequestsPanel() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  const listFn = useServerFn(listAccessRequests);
  const decideFn = useServerFn(decideAccessRequest);
  const lockFn = useServerFn(devLock);
  const requests = useQuery({
    queryKey: ["access-requests"],
    queryFn: () => listFn(),
    retry: false,
    refetchInterval: 30_000,
  });
  const decision = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: DecisionStatus }) =>
      decideFn({ data: { userId, status } }),
    onSuccess: async (_result, variables) => {
      toast.success(variables.status === "approved" ? "Acesso liberado" : "Pedido recusado");
      await queryClient.invalidateQueries({ queryKey: ["access-requests"] });
    },
    onError: () => toast.error("Não foi possível salvar a decisão. Atualize e tente de novo."),
  });

  async function exitDeveloperMode() {
    try {
      await lockFn();
      await queryClient.invalidateQueries({ queryKey: ["dev-status"] });
      await router.invalidate();
      await navigate({ to: "/" });
    } catch {
      toast.error("Não foi possível encerrar o modo desenvolvedor.");
    }
  }

  if (requests.isLoading) {
    return (
      <section className="panel grid place-items-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </section>
    );
  }

  if (requests.isError) {
    return (
      <section className="panel space-y-3 p-5 text-center">
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar os pedidos. Confira a migration de acesso e as credenciais
          Supabase do servidor.
        </p>
        <Button
          variant="chip"
          size="pill"
          className="w-full"
          onClick={() => void requests.refetch()}
        >
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </Button>
      </section>
    );
  }

  const rows = requests.data ?? [];
  const pending = rows.filter((row) => row.status === "pending");
  const processed = rows.filter((row) => row.status !== "pending");

  return (
    <div className="space-y-5 animate-rise">
      <section className="panel flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display font-semibold">Pedidos pendentes</h2>
            <p className="text-xs text-muted-foreground">{pending.length} aguardando revisão</p>
          </div>
        </div>
        <Button
          variant="chip"
          size="icon"
          aria-label="Atualizar pedidos"
          onClick={() => void requests.refetch()}
        >
          <RefreshCw className={`h-4 w-4 ${requests.isFetching ? "animate-spin" : ""}`} />
        </Button>
      </section>

      {pending.length === 0 ? (
        <section className="panel p-5 text-center text-sm text-muted-foreground">
          Nenhum pedido pendente no momento.
        </section>
      ) : (
        <div className="space-y-3">
          {pending.map((row) => (
            <RequestCard
              key={row.user_id}
              email={row.email}
              createdAt={row.created_at}
              busy={decision.isPending}
              onDecide={(status) => decision.mutate({ userId: row.user_id, status })}
            />
          ))}
        </div>
      )}

      {processed.length > 0 && (
        <section className="panel space-y-3 p-4">
          <h2 className="font-display text-sm font-semibold">Decisões recentes</h2>
          {processed.slice(0, 25).map((row) => (
            <div
              key={row.user_id}
              className="flex items-center justify-between gap-3 border-t border-border/70 pt-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{row.email || "Conta sem e-mail"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {row.status === "approved" ? "Liberado" : "Recusado"}
                </p>
              </div>
              <Button
                variant={row.status === "approved" ? "destructive" : "silver"}
                size="pill"
                disabled={decision.isPending}
                onClick={() =>
                  decision.mutate({
                    userId: row.user_id,
                    status: row.status === "approved" ? "rejected" : "approved",
                  })
                }
              >
                {row.status === "approved" ? (
                  <>
                    <LockKeyhole className="h-4 w-4" /> Bloquear
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Liberar
                  </>
                )}
              </Button>
            </div>
          ))}
        </section>
      )}

      <Button
        variant="chip"
        size="pill"
        className="w-full"
        onClick={() => void exitDeveloperMode()}
      >
        <LockKeyhole className="h-4 w-4" /> Encerrar modo desenvolvedor
      </Button>
    </div>
  );
}

function RequestCard({
  email,
  createdAt,
  busy,
  onDecide,
}: {
  email: string;
  createdAt: string;
  busy: boolean;
  onDecide: (status: DecisionStatus) => void;
}) {
  const date = new Date(createdAt);
  const formattedDate = Number.isNaN(date.getTime())
    ? "Data indisponível"
    : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  return (
    <section className="panel space-y-3 p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{email || "Conta sem e-mail"}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Pedido em {formattedDate}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="silver" size="pill" disabled={busy} onClick={() => onDecide("approved")}>
          <Check className="h-4 w-4" /> Aprovar
        </Button>
        <Button
          variant="destructive"
          size="pill"
          disabled={busy}
          onClick={() => onDecide("rejected")}
        >
          <X className="h-4 w-4" /> Recusar
        </Button>
      </div>
    </section>
  );
}
