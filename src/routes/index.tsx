import { createFileRoute } from "@tanstack/react-router";

import { ModeDot } from "@/components/ModeDot";
import { Wordmark } from "@/components/Wordmark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "lovable" },
      { name: "description", content: "lovable — uma palavra, uma tela em branco." },
      { property: "og:title", content: "lovable" },
      { property: "og:description", content: "lovable — uma palavra, uma tela em branco." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex h-dvh w-full items-center justify-center overflow-hidden bg-background">
      <Wordmark />
      <ModeDot />
    </main>
  );
}
