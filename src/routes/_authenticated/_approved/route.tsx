import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { fetchMyAccess } from "@/lib/access";
import { devStatus } from "@/lib/access.functions";

// A developer session is verified server-side and bound to the authenticated Supabase user ID.
export const Route = createFileRoute("/_authenticated/_approved")({
  ssr: false,
  beforeLoad: async () => {
    const developer = await devStatus();
    if (developer.unlocked) return;
    const access = await fetchMyAccess();
    if (!access || access.status !== "approved") throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
