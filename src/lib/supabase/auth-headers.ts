import { createClient } from "@/lib/supabase/client";

/** Attach the Supabase session token for API routes */
export async function getAuthFetchHeaders(
  extra: HeadersInit = {}
): Promise<HeadersInit> {
  const supabase = createClient();
  const headers = new Headers(extra);

  if (!supabase) return headers;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  return headers;
}

export async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}
