import { supabase } from "@/integrations/supabase/client";
import type { AccessStatus } from "./access.functions";

const VALID_STATUSES = new Set<AccessStatus>(["pending", "approved", "rejected"]);

/** Reads only the signed-in person's own request; Supabase RLS enforces ownership. */
export async function fetchMyAccess(): Promise<{
  userId: string;
  email: string;
  status: AccessStatus;
} | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error("Não foi possível validar a sessão.");
  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("access_requests")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Não foi possível consultar a aprovação da conta.");

  const status = (data?.status ?? "pending") as AccessStatus;
  if (!VALID_STATUSES.has(status)) throw new Error("O status de acesso retornado é inválido.");
  return { userId: user.id, email: user.email ?? "", status };
}
