import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Wrapper mantido para facilitar reativação futura; o app está aberto por enquanto. */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: () => <Outlet />,
});
