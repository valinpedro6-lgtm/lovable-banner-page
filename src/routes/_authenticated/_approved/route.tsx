import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { fetchMyAccess } from "@/lib/access";

// Signed-in people only reach the app after the developer approves their request.
export const Route = createFileRoute("/_authenticated/_approved")({
  beforeLoad: async () => {
    const access = await fetchMyAccess();
    if (!access || access.status !== "approved") throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
