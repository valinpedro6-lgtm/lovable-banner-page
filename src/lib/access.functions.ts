import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { devPasswordMatches } from "./dev-password";

export type AccessStatus = "pending" | "approved" | "rejected";
export type DecisionStatus = Exclude<AccessStatus, "pending">;

export interface AccessRequestRow {
  user_id: string;
  email: string;
  status: AccessStatus;
  created_at: string;
  decided_at: string | null;
}

type DevSession = {
  dev?: boolean;
  userId?: string;
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const MIN_DEV_PASSWORD_LENGTH = 12;
const MIN_SESSION_SECRET_LENGTH = 32;

function sessionSecret() {
  return process.env["SESSION_SECRET"]?.trim() ?? "";
}

function hasValidSessionSecret() {
  return sessionSecret().length >= MIN_SESSION_SECRET_LENGTH;
}

function devSessionConfig() {
  const password = sessionSecret();
  if (password.length < MIN_SESSION_SECRET_LENGTH) {
    throw new Error(
      "Configure SESSION_SECRET com pelo menos 32 caracteres no ambiente do servidor.",
    );
  }

  const production = process.env["NODE_ENV"] === "production";
  return {
    password,
    name: "mr-dev-access",
    maxAge: 60 * 60 * 8,
    cookie: {
      httpOnly: true,
      secure: production,
      sameSite: production ? ("none" as const) : ("lax" as const),
      path: "/",
    },
  };
}

async function requireDev(userId: string) {
  if (!hasValidSessionSecret()) throw new Error("Modo desenvolvedor não configurado.");
  // TanStack's useSession is a server utility here, not a React Hook.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const session = await useSession<DevSession>(devSessionConfig());
  if (!session.data.dev || session.data.userId !== userId) {
    throw new Error("Acesso de desenvolvedor bloqueado.");
  }
}

function normalizeUuid(value: unknown) {
  const userId = String(value ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error("Usuário inválido.");
  }
  return userId;
}

export const devUnlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { password: string }) => {
    const password = String(data?.password ?? "");
    if (password.length > 256) throw new Error("Entrada inválida.");
    return { password };
  })
  .handler(async ({ data, context }) => {
    const expected = process.env["DEV_ACCESS_PASSWORD"]?.trim() ?? "";
    if (
      expected.length < MIN_DEV_PASSWORD_LENGTH ||
      !hasValidSessionSecret() ||
      !process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
      !process.env["SUPABASE_URL"]
    ) {
      return { ok: false as const, reason: "unconfigured" as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authRecord, error: authError } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );
    if (authError || !authRecord.user) {
      console.error("[dev_access] failed to read user metadata", authError);
      throw new Error("Não foi possível validar o usuário.");
    }

    const now = Date.now();
    const appMetadata = authRecord.user.app_metadata ?? {};
    const failedAttempts = Number(appMetadata["mr_dev_access_failed_attempts"] ?? 0);
    const lockedUntil = Number(appMetadata["mr_dev_access_locked_until"] ?? 0);
    if (lockedUntil > now) {
      return { ok: false as const, reason: "locked" as const, retryAfterMs: lockedUntil - now };
    }

    if (!devPasswordMatches(data.password, expected)) {
      const nextAttempts = (Number.isFinite(failedAttempts) ? failedAttempts : 0) + 1;
      const nextLockout = nextAttempts >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_MS : 0;
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
        app_metadata: {
          ...appMetadata,
          mr_dev_access_failed_attempts: nextAttempts,
          mr_dev_access_locked_until: nextLockout,
        },
      });
      if (updateError) {
        console.error("[dev_access] failed to persist attempt", updateError);
        throw new Error("Não foi possível registrar a tentativa.");
      }
      return {
        ok: false as const,
        reason: nextLockout ? ("locked" as const) : ("invalid" as const),
        retryAfterMs: nextLockout ? LOCKOUT_MS : 0,
      };
    }

    const { error: clearError } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      app_metadata: {
        ...appMetadata,
        mr_dev_access_failed_attempts: 0,
        mr_dev_access_locked_until: 0,
      },
    });
    if (clearError) {
      console.error("[dev_access] failed to clear attempt counter", clearError);
      throw new Error("Não foi possível completar o acesso administrativo.");
    }

    const session = await useSession<DevSession>(devSessionConfig());
    await session.update({ dev: true, userId: context.userId });
    return { ok: true as const };
  });

export const devStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!hasValidSessionSecret()) return { unlocked: false };
    const session = await useSession<DevSession>(devSessionConfig());
    return { unlocked: Boolean(session.data.dev && session.data.userId === context.userId) };
  });

export const devLock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!hasValidSessionSecret()) return { ok: true as const };
    const session = await useSession<DevSession>(devSessionConfig());
    if (session.data.userId === context.userId) await session.update({ dev: false });
    return { ok: true as const };
  });

export const listAccessRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireDev(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("access_requests")
      .select("user_id, email, status, created_at, decided_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("[access_requests] failed to list requests", error);
      throw new Error("Não foi possível carregar os pedidos de acesso.");
    }
    return (data ?? []).map((row) => ({
      ...row,
      status:
        row.status === "approved" || row.status === "rejected" ? row.status : ("pending" as const),
    }));
  });

export const decideAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { userId: string; status: DecisionStatus }) => {
    const status = data?.status;
    if (status !== "approved" && status !== "rejected") throw new Error("Status inválido.");
    return { userId: normalizeUuid(data?.userId), status };
  })
  .handler(async ({ data, context }) => {
    await requireDev(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await supabaseAdmin
      .from("access_requests")
      .update({ status: data.status, decided_at: new Date().toISOString() })
      .eq("user_id", data.userId)
      .select("user_id")
      .maybeSingle();
    if (error || !updated) {
      console.error("[access_requests] failed to update request", error);
      throw new Error("Não foi possível salvar esta decisão.");
    }
    return { ok: true as const };
  });
