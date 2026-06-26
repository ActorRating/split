import { NextResponse } from "next/server";
import { ensureTodaysPoll } from "@/lib/poll-service";
import { supabaseNotConfiguredResponse } from "@/lib/api-errors";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) return supabaseNotConfiguredResponse();
    const poll = await ensureTodaysPoll(supabase);
    return NextResponse.json(poll);
  } catch (err) {
    console.error("[GET /api/poll/today]", err);
    return NextResponse.json(
      { error: "Failed to fetch today's poll" },
      { status: 500 }
    );
  }
}
