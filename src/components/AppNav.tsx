import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Activity, BarChart3, Dumbbell, Home, Plus, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { devStatus } from "@/lib/access.functions";

type NavItemData = {
  to: "/" | "/status" | "/exercicios" | "/historico" | "/admin";
  label: string;
  icon: LucideIcon;
};

const leftItems = [
  { to: "/", label: "Início", icon: Home },
  { to: "/status", label: "Status", icon: Activity },
] as const;

const rightItems = [
  { to: "/exercicios", label: "Exercícios", icon: Dumbbell },
  { to: "/historico", label: "Histórico", icon: BarChart3 },
] as const;

export function AppNav() {
  const getDevStatus = useServerFn(devStatus);
  const dev = useQuery({
    queryKey: ["dev-status"],
    queryFn: () => getDevStatus(),
    retry: false,
    staleTime: 30_000,
  });
  const isDeveloper = dev.data?.unlocked === true;
  const items = isDeveloper
    ? [...rightItems, { to: "/admin" as const, label: "Aprovar", icon: ShieldCheck }]
    : rightItems;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 mx-auto max-w-lg rounded-[28px] border border-white/10 bg-zinc-950/50 px-1 pt-1 pb-1 shadow-[0_16px_44px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl backdrop-saturate-150"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] items-end px-1 pt-2 pb-2">
        <li>
          <div className="grid grid-cols-2 items-end">
            {leftItems.map((it) => (
              <NavItem key={it.to} item={it} />
            ))}
          </div>
        </li>
        <li className="flex justify-center">
          <Link
            to="/registrar"
            aria-label="Registrar treino"
            className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-silver-gradient text-primary-foreground glow transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </Link>
        </li>
        <li>
          <div className={`grid ${isDeveloper ? "grid-cols-3" : "grid-cols-2"} items-end`}>
            {items.map((it) => (
              <NavItem key={it.to} item={it} />
            ))}
          </div>
        </li>
      </ul>
    </nav>
  );
}

function NavItem({ item }: { item: NavItemData }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.to === "/" }}
      className="flex min-w-0 flex-col items-center gap-1 px-0.5 py-1 text-[9px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary sm:text-[10px]"
    >
      <Icon className="h-5 w-5" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
