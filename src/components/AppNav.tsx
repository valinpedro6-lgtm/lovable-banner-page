import { Link } from "@tanstack/react-router";
import { Activity, BarChart3, Dumbbell, Home, Plus } from "lucide-react";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/status", label: "Status", icon: Activity },
  { to: "/registrar", label: "Registrar", icon: Plus, center: true },
  { to: "/exercicios", label: "Exercícios", icon: Dumbbell },
  { to: "/historico", label: "Histórico", icon: BarChart3 },
] as const;

export function AppNav() {
  return (
    <nav className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 mx-auto max-w-lg rounded-[28px] border border-white/10 bg-zinc-950/50 px-1 pt-1 pb-1 shadow-[0_16px_44px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl backdrop-saturate-150">
      <ul className="mx-auto grid max-w-lg grid-cols-5 items-end px-1 pt-2 pb-2">
        {items.map((it) => (
          <li key={it.to} className="flex justify-center">
            {"center" in it ? (
              <Link
                to={it.to}
                aria-label={it.label}
                className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-lime-gradient text-primary-foreground glow transition-transform active:scale-95"
              >
                <it.icon className="h-6 w-6" strokeWidth={2.5} />
              </Link>
            ) : (
              <Link
                to={it.to}
                activeOptions={{ exact: it.to === "/" }}
                className="flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary"
              >
                <it.icon className="h-5 w-5" />
                {it.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
