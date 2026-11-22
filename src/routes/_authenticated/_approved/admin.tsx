import { createFileRoute, redirect } from "@tanstack/react-router";
import { AccessRequestsPanel } from "@/components/AccessRequestsPanel";
import { PageHeader } from "@/components/PageHeader";
import { devStatus } from "@/lib/access.functions";

export const Route = createFileRoute("/_authenticated/_approved/admin")({
  ssr: false,
  beforeLoad: async () => {
    const status = await devStatus();
    if (!status.unlocked) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ title: "Aprovações · MUSCLE RECOVERY" }] }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Modo desenvolvedor" title="Aprovações" showProfile={false} />
      <AccessRequestsPanel />
    </div>
  );
}
