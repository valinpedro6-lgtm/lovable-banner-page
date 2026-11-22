import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Camada de aprovação pausada junto com o login; todas as telas seguem abertas. */
export const Route = createFileRoute("/_authenticated/_approved")({
  component: () => <Outlet />,
});
