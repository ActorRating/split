import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/supabase/admin";
import type { PollSuggestionResponse } from "@/types/database";

function toResponse(row: Record<string, unknown>): PollSuggestionResponse {
  return {
    id: row.id as string,
    question: row.question as string,
    optionA: (row.option_a ?? null) as string | null,
    optionB: (row.option_b ?? null) as string | null,
    submittedBy: (row.submitted_by ?? null) as string | null,
    status: row.status as PollSuggestionResponse["status"],
    adminNotes: (row.admin_notes ?? null) as string | null,
    createdAt: row.created_at as string,
  };
}

/** GET /api/admin/suggestions */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { supabase } = admin;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "pending";

  const query = supabase
    .from("poll_suggestions")
    .select("*")
    .order("created_at", { ascending: false });

  const { data, error } =
    status === "all" ? await query : await query.eq("status", status);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map(toResponse));
}
