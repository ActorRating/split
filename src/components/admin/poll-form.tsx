"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { POLL_TAGS } from "@/lib/polls";
import type { PollResponse, PollStatus } from "@/types/database";

const EMOJI_SUGGESTIONS = [
  "🍕","🌮","☕","🍵","🍔","🌭","🎵","🎬","💰","👥","✈️","🏠","❤️","🧠","⚙️",
  "🌍","🌱","💡","😊","⚖️","🔥","🎯","🎲","🤖","📱","🛡️","💻","🎮","🏆","⚽",
  "🏀","🎾","🐶","🐱","🌿","☀️","❄️","💎","🚀","🦁","🐘","🦋","🌸","⭐","🙅",
];

interface PollFormProps {
  initial?: Partial<PollResponse>;
  mode: "create" | "edit";
}

export function PollForm({ initial, mode }: PollFormProps) {
  const router = useRouter();
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [optionA, setOptionA] = useState(initial?.optionA ?? "");
  const [optionB, setOptionB] = useState(initial?.optionB ?? "");
  const [emojiA, setEmojiA] = useState(initial?.emojiA ?? "🔵");
  const [emojiB, setEmojiB] = useState(initial?.emojiB ?? "🟣");
  const [status, setStatus] = useState<PollStatus>(initial?.status ?? "draft");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? 3);
  const [date, setDate] = useState(initial?.date ?? "");
  const [scheduledFor, setScheduledFor] = useState(initial?.date ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = {
        question,
        optionA,
        optionB,
        emojiA,
        emojiB,
        status,
        tags,
        difficulty,
        date: date || null,
        scheduledFor: scheduledFor || null,
      };

      const url =
        mode === "edit" ? `/api/admin/polls/${initial?.id}` : "/api/admin/polls";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      router.push("/admin/polls");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label={mode === "create" ? "Create poll form" : "Edit poll form"}>
      {/* Question */}
      <div>
        <label htmlFor="question" className="mb-1.5 block text-[0.8125rem] font-medium text-white/55">
          Question <span className="text-red-400">*</span>
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          rows={3}
          placeholder="Would you rather…"
          className="w-full resize-none rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-[0.9rem] text-white/90 placeholder:text-white/22 outline-none transition-colors focus:border-white/[0.18]"
        />
      </div>

      {/* Options */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Option A */}
        <div className="space-y-2">
          <label htmlFor="optionA" className="block text-[0.8125rem] font-medium text-white/55">
            Option A <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="text"
                value={emojiA}
                onChange={(e) => setEmojiA(e.target.value)}
                maxLength={4}
                className="w-16 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-center text-xl outline-none focus:border-white/[0.18]"
                aria-label="Emoji for Option A"
              />
            </div>
            <input
              id="optionA"
              type="text"
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              required
              placeholder="First choice"
              className="flex-1 rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[0.9rem] text-white/90 placeholder:text-white/22 outline-none focus:border-white/[0.18]"
            />
          </div>
        </div>

        {/* Option B */}
        <div className="space-y-2">
          <label htmlFor="optionB" className="block text-[0.8125rem] font-medium text-white/55">
            Option B <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={emojiB}
              onChange={(e) => setEmojiB(e.target.value)}
              maxLength={4}
              className="w-16 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-center text-xl outline-none focus:border-white/[0.18]"
              aria-label="Emoji for Option B"
            />
            <input
              id="optionB"
              type="text"
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              required
              placeholder="Second choice"
              className="flex-1 rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[0.9rem] text-white/90 placeholder:text-white/22 outline-none focus:border-white/[0.18]"
            />
          </div>
        </div>
      </div>

      {/* Emoji quick-pick */}
      <div>
        <p className="mb-2 text-[0.75rem] text-white/30">Quick emoji picks</p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Emoji suggestions">
          {EMOJI_SUGGESTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                if (!emojiA || emojiA === "🔵") setEmojiA(e);
                else setEmojiB(e);
              }}
              className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-base transition-colors hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-purple-400/60"
              aria-label={`Use ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Status + Date */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="status" className="mb-1.5 block text-[0.8125rem] font-medium text-white/55">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as PollStatus)}
            className="w-full appearance-none rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[0.9rem] text-white/80 outline-none focus:border-white/[0.18]"
          >
            <option value="draft" className="bg-[#1a1a1a]">Draft</option>
            <option value="scheduled" className="bg-[#1a1a1a]">Scheduled</option>
            <option value="published" className="bg-[#1a1a1a]">Published</option>
          </select>
        </div>

        <div>
          <label htmlFor="date" className="mb-1.5 block text-[0.8125rem] font-medium text-white/55">
            Publish Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[0.9rem] text-white/80 outline-none focus:border-white/[0.18]"
          />
        </div>

        <div>
          <label htmlFor="scheduledFor" className="mb-1.5 block text-[0.8125rem] font-medium text-white/55">
            Scheduled For
          </label>
          <input
            id="scheduledFor"
            type="date"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[0.9rem] text-white/80 outline-none focus:border-white/[0.18]"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="mb-2 text-[0.8125rem] font-medium text-white/55">Tags</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Poll tags">
          {POLL_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              aria-pressed={tags.includes(t)}
              className={`rounded-full border px-3 py-1 text-[0.8125rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-purple-400/60 ${
                tags.includes(t)
                  ? "border-purple-500/40 bg-purple-500/15 text-purple-300/85"
                  : "border-white/[0.07] bg-white/[0.03] text-white/40 hover:text-white/65"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <label htmlFor="difficulty" className="mb-2 block text-[0.8125rem] font-medium text-white/55">
          Difficulty: <span className="text-white/75">{difficulty}</span> / 5
        </label>
        <input
          id="difficulty"
          type="range"
          min={1}
          max={5}
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
        <div className="mt-1 flex justify-between text-[0.7rem] text-white/25">
          <span>Easy</span>
          <span>Hard</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-[0.875rem] text-red-300/80">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-white/[0.09] px-6 py-2.5 text-[0.9rem] font-medium text-white/85 transition-colors hover:bg-white/[0.14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400/60 disabled:opacity-50"
        >
          {saving ? "Saving…" : mode === "create" ? "Create Poll" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl px-4 py-2.5 text-[0.9rem] text-white/35 transition-colors hover:text-white/60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
