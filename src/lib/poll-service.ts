import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSeedPollForDate,
  getTodayKey,
  pollRowToResponse,
} from "@/lib/polls";
import type { PollResponse } from "@/types/database";

/**
 * Fetch the poll for a given date.
 * Only returns published/scheduled polls (drafts are admin-only).
 */
export async function getPollByDate(
  supabase: SupabaseClient,
  date: string
): Promise<PollResponse | null> {
  const { data: poll, error } = await supabase
    .from("polls")
    .select("*")
    .eq("date", date)
    .in("status", ["published", "scheduled"])
    .maybeSingle();

  if (error) throw error;

  if (!poll) {
    if (date === getTodayKey()) {
      return ensureTodaysPoll(supabase);
    }
    return null;
  }

  const { data: stats } = await supabase
    .from("poll_stats")
    .select("*")
    .eq("poll_id", poll.id)
    .maybeSingle();

  return pollRowToResponse(poll, stats);
}

/** Ensure today's poll exists — seeds from local pool if the DB is empty */
export async function ensureTodaysPoll(
  supabase: SupabaseClient
): Promise<PollResponse> {
  const today = getTodayKey();

  // Check for existing published/scheduled poll for today
  const { data: existing } = await supabase
    .from("polls")
    .select("*")
    .eq("date", today)
    .in("status", ["published", "scheduled"])
    .maybeSingle();

  if (existing) {
    const { data: stats } = await supabase
      .from("poll_stats")
      .select("*")
      .eq("poll_id", existing.id)
      .maybeSingle();
    return pollRowToResponse(existing, stats);
  }

  // Check if there's a scheduled poll whose scheduled_for date matches today
  const { data: scheduled } = await supabase
    .from("polls")
    .select("*")
    .eq("scheduled_for", today)
    .eq("status", "scheduled")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (scheduled) {
    // Promote it to published and assign the date
    await supabase
      .from("polls")
      .update({ status: "published", date: today })
      .eq("id", scheduled.id);

    const { data: stats } = await supabase
      .from("poll_stats")
      .select("*")
      .eq("poll_id", scheduled.id)
      .maybeSingle();

    return pollRowToResponse({ ...scheduled, date: today, status: "published" }, stats);
  }

  // Last resort: seed from the built-in pool
  const seed = getSeedPollForDate(today);
  const { data: created, error } = await supabase
    .from("polls")
    .insert({
      question: seed.question,
      option_a: seed.optionA,
      option_b: seed.optionB,
      emoji_a: seed.emojiA,
      emoji_b: seed.emojiB,
      date: today,
      status: "published",
      tags: [],
      difficulty: 3,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("poll_stats").insert({
    poll_id: created.id,
    votes_a: 0,
    votes_b: 0,
    total_votes: 0,
  });

  return pollRowToResponse(created, null);
}

/** Update user streak after a successful vote */
export async function updateStreak(
  supabase: SupabaseClient,
  userId: string,
  voteDate: string
): Promise<number> {
  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const yesterday = new Date(voteDate + "T00:00:00Z");
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  let newStreak = 1;

  if (streak) {
    if (streak.last_vote_date === voteDate) return streak.current_streak;
    if (streak.last_vote_date === yesterdayKey) {
      newStreak = streak.current_streak + 1;
    }
  }

  await supabase.from("streaks").upsert({
    user_id: userId,
    current_streak: newStreak,
    last_vote_date: voteDate,
    updated_at: new Date().toISOString(),
  });

  return newStreak;
}

/** Fetch recent published polls for the archive section */
export async function getRecentPolls(
  supabase: SupabaseClient,
  limit = 6
): Promise<PollResponse[]> {
  const today = getTodayKey();

  const { data: polls, error } = await supabase
    .from("polls")
    .select("*")
    .lt("date", today)
    .eq("status", "published")
    .order("date", { ascending: false })
    .limit(limit);

  if (error || !polls?.length) return [];

  const ids = polls.map((p) => p.id);
  const { data: statsList } = await supabase
    .from("poll_stats")
    .select("*")
    .in("poll_id", ids);

  const statsMap = new Map(statsList?.map((s) => [s.poll_id, s]) ?? []);

  return polls.map((p) => pollRowToResponse(p, statsMap.get(p.id)));
}

/** Fetch a random published poll from the DB */
export async function getRandomPoll(
  supabase: SupabaseClient
): Promise<PollResponse | null> {
  const { data: polls, error } = await supabase
    .from("polls")
    .select("*")
    .in("status", ["published", "scheduled"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !polls?.length) return null;

  const poll = polls[Math.floor(Math.random() * polls.length)];
  const { data: stats } = await supabase
    .from("poll_stats")
    .select("*")
    .eq("poll_id", poll.id)
    .maybeSingle();

  return pollRowToResponse(poll, stats);
}
