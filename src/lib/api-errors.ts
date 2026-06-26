import { NextResponse } from "next/server";

export function supabaseNotConfiguredResponse() {
  return NextResponse.json(
    {
      error: "Supabase is not configured",
      code: "SUPABASE_NOT_CONFIGURED",
      hint: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
    },
    { status: 503 }
  );
}
