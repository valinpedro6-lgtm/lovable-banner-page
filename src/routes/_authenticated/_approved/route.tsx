import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_approved")({
  ssr: false,
  component: () => <Outlet />,
});
