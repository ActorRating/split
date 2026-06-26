"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Calendar, FileText, Inbox, Plus, Vote } from "lucide-react";
import type { AdminStatsResponse } from "@/types/database";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  href?: string;
  accent?: string;
}

function StatCard({ label, value, icon, href, accent = "rgba(168,85,247,0.15)" }: StatCardProps) {
  const content = (
    <div className="group flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: accent }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-white/90">{value}</p>
        <p className="mt-0.5 text-[0.8125rem] text-white/40">{label}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400/60 rounded-2xl">
        {content}
      </Link>
    );
  }

  return content;
}

function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
      <div className="skeleton h-9 w-9 rounded-xl" />
      <div className="space-y-1.5">
        <div className="skeleton h-7 w-16 rounded-lg" />
        <div className="skeleton h-4 w-28 rounded-md" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards: StatCardProps[] = stats
    ? [
        {
          label: "Total Polls",
          value: stats.totalPolls.toLocaleString(),
          icon: <BookOpen className="size-4 text-purple-400" />,
          href: "/admin/polls",
          accent: "rgba(168,85,247,0.15)",
        },
        {
          label: "Published",
          value: stats.publishedPolls.toLocaleString(),
          icon: <FileText className="size-4 text-green-400" />,
          href: "/admin/polls?status=published",
          accent: "rgba(74,222,128,0.12)",
        },
        {
          label: "Scheduled",
          value: stats.scheduledPolls.toLocaleString(),
          icon: <Calendar className="size-4 text-blue-400" />,
          href: "/admin/calendar",
          accent: "rgba(96,165,250,0.12)",
        },
        {
          label: "Drafts",
          value: stats.draftPolls.toLocaleString(),
          icon: <FileText className="size-4 text-white/40" />,
          href: "/admin/polls?status=draft",
          accent: "rgba(255,255,255,0.07)",
        },
        {
          label: "Pending Suggestions",
          value: stats.pendingSuggestions.toLocaleString(),
          icon: <Inbox className="size-4 text-amber-400" />,
          href: "/admin/suggestions",
          accent: "rgba(251,191,36,0.12)",
        },
        {
          label: "Today's Votes",
          value: stats.todayVotes.toLocaleString(),
          icon: <Vote className="size-4 text-pink-400" />,
          accent: "rgba(236,72,153,0.12)",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white/90">
            Dashboard
          </h1>
          <p className="mt-1 text-[0.875rem] text-white/38">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
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

      {/* Stats grid */}
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        aria-label="Platform statistics"
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          : cards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-white/25">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Link
            href="/admin/polls/new"
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.022] px-4 py-3.5 text-[0.875rem] font-medium text-white/60 transition-colors hover:border-white/[0.1] hover:text-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400/60"
          >
            <Plus className="size-4 shrink-0 text-purple-400/80" aria-hidden="true" />
            Create a new poll
          </Link>
          <Link
            href="/admin/suggestions"
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.022] px-4 py-3.5 text-[0.875rem] font-medium text-white/60 transition-colors hover:border-white/[0.1] hover:text-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400/60"
          >
            <Inbox className="size-4 shrink-0 text-amber-400/80" aria-hidden="true" />
            Review suggestions
          </Link>
          <Link
            href="/admin/calendar"
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.022] px-4 py-3.5 text-[0.875rem] font-medium text-white/60 transition-colors hover:border-white/[0.1] hover:text-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400/60"
          >
            <Calendar className="size-4 shrink-0 text-blue-400/80" aria-hidden="true" />
            Schedule polls
          </Link>
        </div>
      </div>
    </div>
  );
}
