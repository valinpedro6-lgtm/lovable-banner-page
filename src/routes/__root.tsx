import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CardioTimer } from "@/components/CardioTimer";
import { AppNav } from "@/components/AppNav";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { Toaster } from "@/components/ui/sonner";
import { useHydrated } from "@/hooks/use-hydrated";
import { parseCardioPreset } from "@/lib/cardio-timer";
import { useAppState } from "@/lib/store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">Essa página não existe ou foi movida.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado. Tente de novo ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar de novo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0b0b0b" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Muscle Recovery" },
      { name: "mobile-web-app-capable", content: "yes" },
      { title: "MUSCLE RECOVERY — Recuperação muscular em tempo real" },
      {
        name: "description",
        content: "Registre treinos e acompanhe a recuperação estimada de cada grupo muscular.",
      },
      { property: "og:title", content: "MUSCLE RECOVERY" },
      {
        property: "og:description",
        content: "Registre treinos e acompanhe a recuperação estimada de cada grupo muscular.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg?v=2", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=2", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Geist:wght@400;500;600;700&family=Unbounded:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const hydrated = useHydrated();
  const app = useAppState();
  const [splashDelayElapsed, setSplashDelayElapsed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSplashDelayElapsed(true), 850);
    return () => window.clearTimeout(timer);
  }, []);

  const showSplash = !hydrated || !splashDelayElapsed;
  const showOnboarding = !showSplash && !app.profile.setupComplete;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen grid-bg">
        <main
          className={`mx-auto min-h-screen max-w-lg px-5 ${showSplash || showOnboarding ? "" : "pb-32"}`}
        >
          {showSplash ? (
            <Splash />
          ) : showOnboarding ? (
            <OnboardingWizard />
          ) : (
            <>
              <Outlet />
              <CardioTimerHost />
            </>
          )}
        </main>
        {!showSplash && !showOnboarding && <AppNav />}
      </div>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

function CardioTimerHost() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const search = useRouterState({
    select: (state) => state.location.search as Record<string, unknown>,
  });
  const preset = useMemo(() => parseCardioPreset(search), [search]);

  useEffect(() => {
    if (pathname !== "/" || !preset) return;
    const timeout = window.setTimeout(
      () => document.getElementById("cardio-timer")?.scrollIntoView({ behavior: "smooth" }),
      100,
    );
    return () => window.clearTimeout(timeout);
  }, [pathname, preset]);

  return <CardioTimer visible={pathname === "/" || pathname === "/cardio"} preset={preset} />;
}

function Splash() {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Carregando Muscle Recovery"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.06] blur-3xl"
      />
      <div className="relative flex flex-col items-center">
        <div className="relative mb-8 grid h-24 w-24 place-items-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-primary/15 border-t-primary/90 animate-spin [animation-duration:2.4s] motion-reduce:animate-none"
          />
          <span
            aria-hidden="true"
            className="absolute inset-[7px] rounded-full border border-white/[0.06]"
          />
          <img
            src="/favicon.svg?v=2"
            alt=""
            className="relative h-14 w-14 rounded-2xl shadow-[0_0_32px_rgba(192,192,192,0.16)]"
          />
        </div>
        <p className="font-display text-lg font-semibold tracking-[0.2em] text-foreground">
          MUSCLE RECOVERY
        </p>
        <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
          Treino · recuperação · evolução
        </p>
        <div className="mt-10 flex items-center gap-2" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse motion-reduce:animate-none"
              style={{ animationDelay: `${dot * 180}ms` }}
            />
          ))}
        </div>
        <p className="mt-3 text-[11px] tracking-wide text-muted-foreground">
          Preparando seu painel…
        </p>
      </div>
    </section>
  );
}
