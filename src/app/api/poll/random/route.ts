import { NextResponse } from "next/server";
import { getRandomPoll } from "@/lib/poll-service";
import { supabaseNotConfiguredResponse } from "@/lib/api-errors";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) return supabaseNotConfiguredResponse();
    const poll = await getRandomPoll(supabase);

    if (!poll) {
      return NextResponse.json({ error: "No polls found" }, { status: 404 });
    }

    return NextResponse.json(poll);
  } catch (err) {
    console.error("[GET /api/poll/random]", err);
    return NextResponse.json(
      { error: "Failed to fetch random poll" },
      { status: 500 }
    );
  }
}
