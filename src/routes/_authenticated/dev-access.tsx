import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { DevAccessCard } from "@/components/DevAccessCard";

export const Route = createFileRoute("/_authenticated/dev-access")({
  ssr: false,
  head: () => ({ meta: [{ title: "Acesso do desenvolvedor · MUSCLE RECOVERY" }] }),
  component: DevAccessPage,
});

function DevAccessPage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Conta" title="Acesso do desenvolvedor" showProfile={false} />
      <DevAccessCard />
    </div>
  );
}
