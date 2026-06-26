import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/supabase/admin";
import { pollRowToResponse } from "@/lib/polls";

type Params = { params: Promise<{ id: string }> };

/**
 * PUT /api/admin/suggestions/[id]
 * Body: { action: "approve" | "reject", adminNotes?, optionA?, optionB?, emojiA?, emojiB? }
 */
export async function PUT(request: Request, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { supabase } = admin;
  const { id } = await params;
  const body = await request.json();
  const { action, adminNotes, optionA, optionB, emojiA, emojiB } = body;

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const { data: suggestion, error: fetchError } = await supabase
    .from("poll_suggestions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !suggestion) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }

  // Update suggestion status
  await supabase
    .from("poll_suggestions")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      admin_notes: adminNotes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (action === "reject") {
    return NextResponse.json({ ok: true });
  }

  // Approve → create a draft poll from the suggestion
  const { data: poll, error: insertError } = await supabase
    .from("polls")
    .insert({
      question: suggestion.question,
      option_a: optionA ?? suggestion.option_a ?? "Option A",
      option_b: optionB ?? suggestion.option_b ?? "Option B",
      emoji_a: emojiA ?? "🔵",
      emoji_b: emojiB ?? "🟣",
      status: "draft",
      tags: [],
      difficulty: 3,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase
    .from("poll_stats")
    .insert({ poll_id: poll.id, votes_a: 0, votes_b: 0, total_votes: 0 });

  return NextResponse.json({ ok: true, poll: pollRowToResponse(poll, null) });
}
