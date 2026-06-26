"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { PollForm } from "@/components/admin/poll-form";
import type { PollResponse } from "@/types/database";

export default function EditPollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [poll, setPoll] = useState<PollResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/polls/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Poll not found");
        return r.json();
      })
      .then(setPoll)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <div className="skeleton h-8 w-40 rounded-xl" />
          <div className="skeleton h-4 w-64 rounded-lg" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="text-center py-16 text-white/40">
        Poll not found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white/90">
          Edit Poll
        </h1>
        <p className="mt-1 line-clamp-1 text-[0.875rem] text-white/38">
          {poll.question}
        </p>
      </div>

      <PollForm mode="edit" initial={poll} />
    </div>
  );
}
