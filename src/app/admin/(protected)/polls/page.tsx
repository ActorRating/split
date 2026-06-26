"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Edit2, Plus, Search, Tag, Trash2 } from "lucide-react";
import { POLL_TAGS } from "@/lib/polls";
import type { PollResponse, PollStatus } from "@/types/database";

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Published", value: "published" },
];

const STATUS_BADGE: Record<PollStatus, string> = {
  draft: "bg-white/[0.06] text-white/38",
  scheduled: "bg-blue-500/15 text-blue-300/80",
  published: "bg-green-500/12 text-green-300/75",
};

function PollRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-white/[0.04] px-5 py-4">
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded-md" />
        <div className="skeleton h-3 w-1/2 rounded-md" />
      </div>
      <div className="skeleton h-5 w-16 rounded-full" />
      <div className="skeleton h-5 w-20 rounded-md" />
    </div>
  );
}

export default function PollLibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [polls, setPolls] = useState<PollResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const status = searchParams.get("status") ?? "all";
  const tag = searchParams.get("tag") ?? "";
  const q = searchParams.get("q") ?? "";

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (tag) params.set("tag", tag);
    if (q) params.set("q", q);
    params.set("limit", status === "scheduled" ? "365" : "100");

    try {
      const res = await fetch(`/api/admin/polls?${params}`);
      const data = await res.json();
      setPolls(data.polls ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [status, tag, q]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/admin/polls?${next}`);
  };

  const handleDelete = async (id: string, question: string) => {
    if (!confirm(`Delete "${question}"?`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/polls/${id}`, { method: "DELETE" });
      setPolls((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white/90">
            Poll Library
          </h1>
          <p className="mt-1 text-[0.875rem] text-white/38">
            {total.toLocaleString()} polls total
          </p>
        </div>
        <Link
          href="/admin/polls/new"
          className="flex items-center gap-2 rounded-xl bg-white/[0.08] px-4 py-2 text-[0.875rem] font-medium text-white/80 transition-colors hover:bg-white/[0.12] hover:text-white/95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400/60"
        >
          <Plus className="size-4" aria-hidden="true" />
          New Poll
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Status tabs */}
        <div className="flex rounded-xl border border-white/[0.07] bg-white/[0.03] p-0.5" role="tablist">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={status === opt.value}
              onClick={() => updateParam("status", opt.value === "all" ? "" : opt.value)}
              className={`rounded-lg px-3 py-1.5 text-[0.8125rem] font-medium transition-colors ${
                status === opt.value
                  ? "bg-white/[0.09] text-white/85"
                  : "text-white/35 hover:text-white/60"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Tag filter */}
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" aria-hidden="true" />
          <select
            value={tag}
            onChange={(e) => updateParam("tag", e.target.value)}
            className="appearance-none rounded-xl border border-white/[0.07] bg-white/[0.03] py-2 pl-8 pr-4 text-[0.8125rem] text-white/60 outline-none focus:border-white/[0.14]"
            aria-label="Filter by tag"
          >
            <option value="">All tags</option>
            {POLL_TAGS.map((t) => (
              <option key={t} value={t} className="bg-[#1a1a1a]">
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => updateParam("q", e.target.value)}
            placeholder="Search questions…"
            className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] py-2 pl-8 pr-4 text-[0.8125rem] text-white/70 placeholder:text-white/22 outline-none focus:border-white/[0.14]"
            aria-label="Search polls"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
        {/* Col headers */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-white/[0.06] px-5 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-white/25">
          <span>Question</span>
          <span>Status</span>
          <span>Date</span>
          <span>Actions</span>
        </div>

        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <PollRowSkeleton key={i} />)
        ) : polls.length === 0 ? (
          <div className="px-5 py-16 text-center text-[0.875rem] text-white/28">
            No polls found.{" "}
            <Link href="/admin/polls/new" className="text-purple-400/80 hover:text-purple-300">
              Create one
            </Link>
          </div>
        ) : (
          polls.map((poll) => (
            <div
              key={poll.id}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-white/[0.04] px-5 py-4 transition-colors last:border-0 hover:bg-white/[0.02]"
            >
              {/* Question */}
              <div className="min-w-0">
                <p className="truncate text-[0.875rem] font-medium text-white/78">
                  {poll.question}
                </p>
                <p className="mt-0.5 truncate text-[0.78rem] text-white/30">
                  {poll.emojiA} {poll.optionA} · {poll.emojiB} {poll.optionB}
                </p>
              </div>

              {/* Status badge */}
              <span
                className={`rounded-full px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-wide ${STATUS_BADGE[poll.status]}`}
              >
                {poll.status}
              </span>

              {/* Date */}
              <span className="text-[0.78rem] text-white/30 tabular-nums">
                {poll.date ?? "—"}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/polls/${poll.id}/edit`}
                  className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/70 focus-visible:outline-2 focus-visible:outline-purple-400/60"
                  aria-label={`Edit "${poll.question}"`}
                >
                  <Edit2 className="size-3.5" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(poll.id, poll.question)}
                  disabled={deleting === poll.id}
                  className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400/80 focus-visible:outline-2 focus-visible:outline-red-400/60 disabled:opacity-40"
                  aria-label={`Delete "${poll.question}"`}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
