import { NextResponse } from "next/server";
import { ensureTodaysPoll } from "@/lib/poll-service";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json({ hasVoted: false, choice: null, streak: 0 });
    }

    const { supabase, user } = auth;

    const poll = await ensureTodaysPoll(supabase);

    const { data: vote } = await supabase
      .from("votes")
      .select("choice")
      .eq("user_id", user.id)
      .eq("poll_id", poll.id)
      .maybeSingle();

    const { data: streak } = await supabase
      .from("streaks")
      .select("current_streak")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({
      hasVoted: !!vote,
      choice: vote?.choice ?? null,
      streak: streak?.current_streak ?? 0,
    });
  } catch (err) {
    console.error("[GET /api/vote/status]", err);
    return NextResponse.json(
      { error: "Failed to fetch vote status" },
      { status: 500 }
    );
  }
}
