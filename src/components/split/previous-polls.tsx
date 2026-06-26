"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { PollResponse } from "@/types/database";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Skeleton row that matches the real card height */
function ArchiveSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.04] bg-white/[0.018]"
          style={{ height: "5.5rem" }}
        >
          <div className="skeleton h-full rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

/** Mini bar showing the split visually */
function MiniBar({ pct }: { pct: number }) {
  return (
    <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.07]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-purple-500/60 to-blue-500/50"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface ArchivePollCardProps {
  poll: PollResponse;
  index: number;
}

function ArchivePollCard({ poll, index }: ArchivePollCardProps) {
  const pA = Math.round(poll.percentages.a);
  const pB = 100 - pA;
  const formattedDate = new Date(poll.date + "T00:00:00Z").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: EASE }}
    >
      <Link
        href={`/poll/${poll.date}`}
        className="group block rounded-2xl border border-white/[0.045] bg-white/[0.018] p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.09] hover:bg-white/[0.035] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400/60"
        aria-label={`View results for: ${poll.question}`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="flex-1 text-[0.875rem] font-medium leading-snug text-white/60 transition-colors group-hover:text-white/80">
            {poll.question}
          </p>
          <time
            dateTime={poll.date ?? undefined}
            className="shrink-0 text-[0.75rem] text-white/22 tabular-nums"
          >
            {formattedDate}
          </time>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 text-[0.8rem] text-white/38">
          <span className="truncate">{poll.optionA}</span>
          <span className="shrink-0 font-semibold tabular-nums text-white/50">{pA}%</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-4 text-[0.8rem] text-white/38">
          <span className="truncate">{poll.optionB}</span>
          <span className="shrink-0 font-semibold tabular-nums text-white/50">{pB}%</span>
        </div>

        <MiniBar pct={pA} />
      </Link>
    </motion.div>
  );
}

export function PreviousPolls() {
  const [polls, setPolls] = useState<PollResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/poll/recent")
      .then((r) => r.json())
      .then((data) => setPolls(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ArchiveSkeleton />;
  if (!polls.length) return null;

  return (
    <motion.section
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.65, ease: EASE }}
      aria-label="Previous polls"
    >
      <h3 className="text-center text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-white/22">
        Previous Polls
      </h3>

      <div className="flex flex-col gap-2.5">
        {polls.map((poll, i) => (
          <ArchivePollCard key={poll.id} poll={poll} index={i} />
        ))}
      </div>
    </motion.section>
  );
}
