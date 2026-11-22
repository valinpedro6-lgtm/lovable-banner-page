import { supabase } from "@/integrations/supabase/client";
import type { AccessStatus } from "./access.functions";

let approvedUserId: string | null = null;

/** Reads the signed-in person's own access request (RLS: own row only). */
export async function fetchMyAccess(): Promise<{ userId: string; email: string; status: AccessStatus } | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  if (approvedUserId === user.id) return { userId: user.id, email: user.email ?? "", status: "approved" };
  const { data } = await supabase
    .from("access_requests")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  const status = (data?.status as AccessStatus | undefined) ?? "pending";
  approvedUserId = status === "approved" ? user.id : null;
  return { userId: user.id, email: user.email ?? "", status };
}

export function forgetAccessCache() {
  approvedUserId = null;
}
