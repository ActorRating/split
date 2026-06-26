import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const MAX_QUESTION_LENGTH = 280;

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { supabase, user } = auth;

    const { success } = rateLimit(`suggest:${user.id}`, 3, 60_000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many suggestions. Try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const question =
      typeof body.question === "string"
        ? body.question.trim().slice(0, MAX_QUESTION_LENGTH)
        : "";

    if (question.length < 10) {
      return NextResponse.json(
        { error: "Question must be at least 10 characters" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("suggestions").insert({
      question,
      user_id: user.id,
    });

    if (error) {
      console.error("[POST /api/suggest]", error);
      return NextResponse.json(
        { error: "Failed to submit suggestion" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/suggest]", err);
    return NextResponse.json(
      { error: "Failed to submit suggestion" },
      { status: 500 }
    );
  }
}
