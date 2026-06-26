import { NextResponse } from "next/server";
import { getRecentPolls } from "@/lib/poll-service";
import { supabaseNotConfiguredResponse } from "@/lib/api-errors";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) return supabaseNotConfiguredResponse();
    const polls = await getRecentPolls(supabase, 6);
    return NextResponse.json(polls);
  } catch (err) {
    console.error("[GET /api/poll/recent]", err);
    return NextResponse.json(
      { error: "Failed to fetch recent polls" },
      { status: 500 }
    );
  }
}
