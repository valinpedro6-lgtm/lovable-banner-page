import { createFileRoute, redirect } from "@tanstack/react-router";

/** Login e aprovação estão pausados; a rota antiga volta ao app aberto. */
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
  component: () => null,
});
