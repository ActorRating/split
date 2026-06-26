import { NextResponse } from "next/server";
import { getPollByDate } from "@/lib/poll-service";
import { supabaseNotConfiguredResponse } from "@/lib/api-errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) return supabaseNotConfiguredResponse();
    const poll = await getPollByDate(supabase, date);

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    return NextResponse.json(poll);
  } catch (err) {
    console.error("[GET /api/poll/[date]]", err);
    return NextResponse.json(
      { error: "Failed to fetch poll" },
      { status: 500 }
    );
  }
}
