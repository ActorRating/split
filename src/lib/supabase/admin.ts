import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Verify that the request comes from an authenticated admin.
 * Returns {supabase, user} or null if unauthorized.
 */
export async function requireAdmin(
  request?: Request
): Promise<{ supabase: SupabaseClient; user: User } | null> {
  const auth = await getAuthenticatedUser(request);
  if (!auth) return null;

  const { supabase, user } = auth;

  // Check admin_users table. RLS allows users to see their own row.
  const { data } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;

  return { supabase, user };
}

/** Shared 403 response for non-admin requests */
export function forbiddenResponse() {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

/** Shared 401 response for unauthenticated requests */
export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
