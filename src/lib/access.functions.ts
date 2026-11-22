import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { devPasswordMatches } from "./dev-password";

type DevSession = { dev?: boolean };
export type AccessStatus = "pending" | "approved" | "rejected";
export interface AccessRequestRow {
  user_id: string;
  email: string;
  status: AccessStatus;
  created_at: string;
  decided_at: string | null;
}

// Built per call: env is injected per request on the server runtime.
function devSessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "mr-dev-access",
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

async function requireDev() {
  const session = await useSession<DevSession>(devSessionConfig());
  if (!session.data.dev) throw new Error("Acesso de desenvolvedor bloqueado");
}

export const devUnlock = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => ({ password: String(data?.password ?? "") }))
  .handler(async ({ data }) => {
    const expected = process.env["DEV_ACCESS_PASSWORD"] ?? "";
    if (!devPasswordMatches(data.password, expected)) return { ok: false as const };
    const session = await useSession<DevSession>(devSessionConfig());
    await session.update({ dev: true });
    return { ok: true as const };
  });

export const devStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<DevSession>(devSessionConfig());
  return { unlocked: Boolean(session.data.dev) };
});

export const devLock = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<DevSession>(devSessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const listAccessRequests = createServerFn({ method: "GET" }).handler(async () => {
  await requireDev();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("access_requests")
    .select("user_id, email, status, created_at, decided_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as AccessRequestRow[];
});

export const decideAccessRequest = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string; status: AccessStatus }) => {
    const status = data?.status;
    if (status !== "approved" && status !== "rejected" && status !== "pending") {
      throw new Error("Status inválido");
    }
    const userId = String(data?.userId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("Usuário inválido");
    return { userId, status };
  })
  .handler(async ({ data }) => {
    await requireDev();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("access_requests")
      .update({ status: data.status, decided_at: data.status === "pending" ? null : new Date().toISOString() })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
