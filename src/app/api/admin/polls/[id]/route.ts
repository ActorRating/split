import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/supabase/admin";
import { pollRowToResponse } from "@/lib/polls";

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/polls/[id] */
export async function GET(request: Request, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { supabase } = admin;
  const { id } = await params;

  const { data: poll, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  const { data: stats } = await supabase
    .from("poll_stats")
    .select("*")
    .eq("poll_id", id)
    .maybeSingle();

  return NextResponse.json(pollRowToResponse(poll, stats));
}

/** PUT /api/admin/polls/[id] — update poll */
export async function PUT(request: Request, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { supabase } = admin;
  const { id } = await params;
  const body = await request.json();

  const update: Record<string, unknown> = {};

  if (body.question !== undefined) update.question = body.question.trim();
  if (body.optionA !== undefined) update.option_a = body.optionA.trim();
  if (body.optionB !== undefined) update.option_b = body.optionB.trim();
  if (body.emojiA !== undefined) update.emoji_a = body.emojiA;
  if (body.emojiB !== undefined) update.emoji_b = body.emojiB;
  if (body.status !== undefined) update.status = body.status;
  if (body.tags !== undefined) update.tags = body.tags;
  if (body.difficulty !== undefined) update.difficulty = body.difficulty;
  if (body.date !== undefined) update.date = body.date || null;
  if (body.scheduledFor !== undefined) update.scheduled_for = body.scheduledFor || null;

  const { data: poll, error } = await supabase
    .from("polls")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: stats } = await supabase
    .from("poll_stats")
    .select("*")
    .eq("poll_id", id)
    .maybeSingle();

  return NextResponse.json(pollRowToResponse(poll, stats));
}

/** DELETE /api/admin/polls/[id] */
export async function DELETE(request: Request, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { supabase } = admin;
  const { id } = await params;

  const { error } = await supabase.from("polls").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
