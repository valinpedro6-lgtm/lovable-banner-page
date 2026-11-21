import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  right,
  showProfile = true,
}: {
  eyebrow?: string;
  title: ReactNode;
  right?: ReactNode;
  showProfile?: boolean;
}) {
  return (
    <header className="flex items-start justify-between gap-4 pt-6 pb-5">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-2xl font-semibold leading-tight">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {right}
        {showProfile && (
          <Link
            to="/perfil"
            aria-label="Perfil"
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
          >
            <UserRound className="h-5 w-5" />
          </Link>
        )}
      </div>
    </header>
  );
}

export function Disclaimer() {
  return (
    <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
      Valores estimados a partir dos seus registros — não são medições fisiológicas.
    </p>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {children}
      </h2>
      {action}
    </div>
  );
}
