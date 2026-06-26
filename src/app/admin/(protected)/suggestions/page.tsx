"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { PollSuggestionResponse, SuggestionStatus } from "@/types/database";

const STATUS_TABS: { label: string; value: SuggestionStatus | "all" }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
];

const STATUS_STYLE: Record<SuggestionStatus, string> = {
  pending: "bg-amber-500/12 text-amber-300/75",
  approved: "bg-green-500/12 text-green-300/75",
  rejected: "bg-red-500/10 text-red-300/60",
};

interface ApproveModalProps {
  suggestion: PollSuggestionResponse;
  onClose: () => void;
  onApproved: () => void;
}

function ApproveModal({ suggestion, onClose, onApproved }: ApproveModalProps) {
  const [optionA, setOptionA] = useState(suggestion.optionA ?? "");
  const [optionB, setOptionB] = useState(suggestion.optionB ?? "");
  const [emojiA, setEmojiA] = useState("🔵");
  const [emojiB, setEmojiB] = useState("🟣");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = async () => {
    if (!optionA.trim() || !optionB.trim()) {
      setError("Both options are required before approving.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/suggestions/${suggestion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          optionA,
          optionB,
          emojiA,
          emojiB,
          adminNotes: notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      onApproved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approve-title"
    >
      <div className="w-full max-w-lg space-y-5 rounded-3xl border border-white/[0.08] bg-[#121212] p-7 shadow-2xl">
        <div>
          <h2 id="approve-title" className="text-lg font-bold text-white/90">
            Approve Suggestion
          </h2>
          <p className="mt-1 text-[0.875rem] text-white/50">
            Fill in both options to create a draft poll.
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-[0.9rem] text-white/75">{suggestion.question}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={emojiA}
              onChange={(e) => setEmojiA(e.target.value)}
              maxLength={4}
              className="w-14 rounded-xl border border-white/[0.09] bg-white/[0.04] px-2 py-2.5 text-center text-xl outline-none focus:border-white/[0.18]"
              aria-label="Emoji A"
            />
            <input
              type="text"
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              placeholder="Option A"
              required
              className="flex-1 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-[0.875rem] text-white/80 placeholder:text-white/22 outline-none focus:border-white/[0.18]"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={emojiB}
              onChange={(e) => setEmojiB(e.target.value)}
              maxLength={4}
              className="w-14 rounded-xl border border-white/[0.09] bg-white/[0.04] px-2 py-2.5 text-center text-xl outline-none focus:border-white/[0.18]"
              aria-label="Emoji B"
            />
            <input
              type="text"
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              placeholder="Option B"
              required
              className="flex-1 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-[0.875rem] text-white/80 placeholder:text-white/22 outline-none focus:border-white/[0.18]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="admin-notes" className="mb-1.5 block text-[0.8125rem] text-white/45">
            Admin notes (optional)
          </label>
          <input
            id="admin-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal note…"
            className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-[0.875rem] text-white/70 placeholder:text-white/22 outline-none focus:border-white/[0.18]"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-2.5 text-[0.8125rem] text-red-300/80">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleApprove}
            disabled={saving}
            className="flex-1 rounded-xl bg-green-500/15 py-2.5 text-[0.875rem] font-medium text-green-300/85 transition-colors hover:bg-green-500/22 focus-visible:outline-2 focus-visible:outline-green-400/60 disabled:opacity-50"
          >
            {saving ? "Creating…" : "Approve & Create Draft"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-[0.875rem] text-white/40 transition-colors hover:text-white/65"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<PollSuggestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SuggestionStatus | "all">("pending");
  const [approving, setApproving] = useState<PollSuggestionResponse | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/suggestions?status=${activeTab}`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleReject = async (id: string) => {
    if (!confirm("Reject this suggestion?")) return;
    setActioning(id);
    try {
      await fetch(`/api/admin/suggestions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setActioning(null);
    }
  };

  return (
    <>
      {approving && (
        <ApproveModal
          suggestion={approving}
          onClose={() => setApproving(null)}
          onApproved={() => {
            setApproving(null);
            fetchSuggestions();
          }}
        />
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white/90">
            Suggestions
          </h1>
          <p className="mt-1 text-[0.875rem] text-white/38">
            Review and moderate user-submitted poll ideas.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-white/[0.07] bg-white/[0.03] p-0.5 w-fit" role="tablist">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-lg px-4 py-1.5 text-[0.8125rem] font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-white/[0.09] text-white/85"
                  : "text-white/35 hover:text-white/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-2.5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))
          ) : suggestions.length === 0 ? (
            <div className="py-16 text-center text-[0.875rem] text-white/28">
              No {activeTab === "all" ? "" : activeTab} suggestions.
            </div>
          ) : (
            suggestions.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-white/[0.055] bg-white/[0.02] p-5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[0.9rem] font-medium text-white/78">
                    {s.question}
                  </p>
                  {(s.optionA || s.optionB) && (
                    <p className="mt-1 text-[0.8rem] text-white/35">
                      {s.optionA} · {s.optionB}
                    </p>
                  )}
                  <p className="mt-1.5 text-[0.75rem] text-white/22">
                    {new Date(s.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold uppercase tracking-wide ${STATUS_STYLE[s.status]}`}
                  >
                    {s.status}
                  </span>

                  {s.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setApproving(s)}
                        disabled={actioning === s.id}
                        className="flex items-center gap-1.5 rounded-lg bg-green-500/12 px-3 py-1.5 text-[0.8rem] font-medium text-green-300/80 transition-colors hover:bg-green-500/20 focus-visible:outline-2 focus-visible:outline-green-400/60 disabled:opacity-40"
                        aria-label="Approve suggestion"
                      >
                        <Check className="size-3.5" aria-hidden="true" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(s.id)}
                        disabled={actioning === s.id}
                        className="flex items-center gap-1.5 rounded-lg bg-red-500/[0.08] px-3 py-1.5 text-[0.8rem] font-medium text-red-300/70 transition-colors hover:bg-red-500/15 focus-visible:outline-2 focus-visible:outline-red-400/60 disabled:opacity-40"
                        aria-label="Reject suggestion"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
