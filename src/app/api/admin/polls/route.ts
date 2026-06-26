import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/supabase/admin";
import { pollRowToResponse } from "@/lib/polls";

/** GET /api/admin/polls — list all polls with optional filters */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { supabase } = admin;
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status");
  const tag = searchParams.get("tag");
  const q = searchParams.get("q");
  const sort = searchParams.get("sort");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = (page - 1) * limit;

  let query = supabase.from("polls").select("*", { count: "exact" });

  // Chronological by default; drafts/unscheduled sink to the bottom
  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (status === "published") {
    query = query.order("date", { ascending: false, nullsFirst: false });
  } else {
    query = query
      .order("date", { ascending: true, nullsFirst: false })
      .order("scheduled_for", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
  }

  query = query.range(offset, offset + limit - 1);

  if (status && status !== "all") query = query.eq("status", status);
  if (tag) query = query.contains("tags", [tag]);
  if (q) query = query.ilike("question", `%${q}%`);

  const { data: polls, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch stats for all returned polls
  const ids = (polls ?? []).map((p) => p.id);
  const { data: statsList } = ids.length
    ? await supabase.from("poll_stats").select("*").in("poll_id", ids)
    : { data: [] };

  const statsMap = new Map(statsList?.map((s) => [s.poll_id, s]) ?? []);

  return NextResponse.json({
    polls: (polls ?? []).map((p) => pollRowToResponse(p, statsMap.get(p.id))),
    total: count ?? 0,
    page,
    limit,
  });
}

/** POST /api/admin/polls — create a new poll */
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { supabase } = admin;

  const body = await request.json();
  const {
    question,
    optionA,
    optionB,
    emojiA,
    emojiB,
    status = "draft",
    tags = [],
    difficulty = 3,
    scheduledFor,
    date,
  } = body;

  if (!question?.trim() || !optionA?.trim() || !optionB?.trim()) {
    return NextResponse.json(
      { error: "question, optionA, and optionB are required" },
      { status: 400 }
    );
  }

  const insert: Record<string, unknown> = {
    question: question.trim(),
    option_a: optionA.trim(),
    option_b: optionB.trim(),
    emoji_a: emojiA ?? "🔵",
    emoji_b: emojiB ?? "🟣",
    status,
    tags,
    difficulty,
  };

  if (scheduledFor) insert.scheduled_for = scheduledFor;
  if (date) insert.date = date;

  const { data: poll, error } = await supabase
    .from("polls")
    .insert(insert)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create empty stats row
  await supabase
    .from("poll_stats")
    .insert({ poll_id: poll.id, votes_a: 0, votes_b: 0, total_votes: 0 })
    .select();

  return NextResponse.json(pollRowToResponse(poll, null), { status: 201 });
}
