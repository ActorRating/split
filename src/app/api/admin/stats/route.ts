import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/supabase/admin";
import { getTodayKey } from "@/lib/polls";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { supabase } = admin;
  const today = getTodayKey();

  const [
    { count: totalPolls },
    { count: publishedPolls },
    { count: scheduledPolls },
    { count: draftPolls },
    { count: pendingSuggestions },
    { data: todayStats },
  ] = await Promise.all([
    supabase.from("polls").select("*", { count: "exact", head: true }),
    supabase
      .from("polls")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("polls")
      .select("*", { count: "exact", head: true })
      .eq("status", "scheduled"),
    supabase
      .from("polls")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("poll_suggestions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("polls")
      .select("poll_stats(total_votes)")
      .eq("date", today)
      .maybeSingle(),
  ]);

  const todayVotes =
    // @ts-expect-error Supabase join shape
    (todayStats?.poll_stats as { total_votes: number } | null)?.total_votes ?? 0;

  return NextResponse.json({
    totalPolls: totalPolls ?? 0,
    publishedPolls: publishedPolls ?? 0,
    scheduledPolls: scheduledPolls ?? 0,
    draftPolls: draftPolls ?? 0,
    pendingSuggestions: pendingSuggestions ?? 0,
    todayVotes,
  });
}
