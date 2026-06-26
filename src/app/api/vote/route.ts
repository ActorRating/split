import { NextResponse } from "next/server";
import { ensureTodaysPoll, updateStreak } from "@/lib/poll-service";
import { computePercentages, getTodayKey } from "@/lib/polls";
import { rateLimit } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { VoteChoice } from "@/types/database";

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { supabase, user } = auth;

    const { success } = rateLimit(`vote:${user.id}`, 5, 60_000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many votes. Try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const choice = body.choice as VoteChoice;

    if (choice !== "A" && choice !== "B") {
      return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
    }

    const poll = await ensureTodaysPoll(supabase);

    // Reject duplicate votes
    const { data: existing } = await supabase
      .from("votes")
      .select("choice")
      .eq("user_id", user.id)
      .eq("poll_id", poll.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Already voted", choice: existing.choice },
        { status: 409 }
      );
    }

    const { error: insertError } = await supabase.from("votes").insert({
      user_id: user.id,
      poll_id: poll.id,
      choice,
    });

    if (insertError) {
      console.error("[POST /api/vote] insert", insertError);
      return NextResponse.json({ error: "Failed to record vote" }, { status: 500 });
    }

    const streak = await updateStreak(supabase, user.id, getTodayKey());

    // Fetch updated stats (trigger updates poll_stats)
    const { data: stats } = await supabase
      .from("poll_stats")
      .select("*")
      .eq("poll_id", poll.id)
      .single();

    const votesA = stats?.votes_a ?? poll.votesA + (choice === "A" ? 1 : 0);
    const votesB = stats?.votes_b ?? poll.votesB + (choice === "B" ? 1 : 0);
    const totalVotes = stats?.total_votes ?? votesA + votesB;
    const percentages = computePercentages(votesA, votesB);

    return NextResponse.json({
      choice,
      streak,
      votesA,
      votesB,
      totalVotes,
      percentages,
    });
  } catch (err) {
    console.error("[POST /api/vote]", err);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
