import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

export async function createClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll called from Server Component — safe to ignore
        }
      },
    },
  });
}

/**
 * Resolve the authenticated user from cookies or Authorization bearer token.
 * Bearer is required when the browser session cookie hasn't synced to the server.
 */
export async function getAuthenticatedUser(
  request?: Request
): Promise<{ supabase: SupabaseClient; user: User } | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const authHeader = request?.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      return { supabase, user };
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return { supabase, user };
}

/** Server client that throws when Supabase is not configured */
export async function requireClient(): Promise<SupabaseClient> {
  const client = await createClient();
  if (!client) {
    throw new Error("Supabase is not configured");
  }
  return client;
}
