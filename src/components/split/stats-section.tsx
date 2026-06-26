"use client";

import { motion } from "framer-motion";
import { getDivisivenessLabel, getDivisivenessScore } from "@/lib/polls";

const EASE = [0.16, 1, 0.3, 1] as const;

interface StatsSectionProps {
  hasVoted: boolean;
  choice: 0 | 1 | null;
  percentA: number;
  percentB: number;
  totalVotes: number;
  streak: number;
  votesA: number;
  votesB: number;
}

interface StatCardProps {
  emoji: string;
  label: string;
  delay: number;
}

function StatCard({ emoji, label, delay }: StatCardProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.055] bg-white/[0.025] px-4 py-5 backdrop-blur-sm"
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: EASE }}
    >
      <span className="text-[1.375rem] leading-none" role="img" aria-hidden="true">
        {emoji}
      </span>
      <span className="text-center text-[0.8125rem] font-medium leading-snug text-white/40">
        {label}
      </span>
    </motion.div>
  );
}

export function StatsSection({
  hasVoted,
  choice,
  percentA,
  percentB,
  totalVotes,
  streak,
  votesA,
  votesB,
}: StatsSectionProps) {
  if (!hasVoted || choice === null) return null;

  const userPercent = choice === 0 ? percentA : percentB;
  const divisiveness = getDivisivenessScore(votesA, votesB);
  const { emoji: divEmoji, label: divLabel } = getDivisivenessLabel(divisiveness);

  const stats: StatCardProps[] = [
    { emoji: "🔥", label: `${streak === 1 ? "1 day" : `${streak} days`} streak`, delay: 0.5 },
    { emoji: divEmoji, label: divLabel, delay: 0.6 },
    { emoji: "🌍", label: `${totalVotes.toLocaleString()} votes`, delay: 0.7 },
  ];

  return (
    <motion.section
      className="space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.38, ease: EASE }}
      aria-label="Your voting stats"
    >
      <p className="text-center text-[0.9375rem] text-white/48">
        You voted with{" "}
        <span className="font-semibold text-white/80">
          {Math.round(userPercent)}%
        </span>{" "}
        of people.
      </p>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3" role="list">
        {stats.map((s) => (
          <div key={s.label} role="listitem">
            <StatCard {...s} />
          </div>
        ))}
      </div>
    </motion.section>
  );
}
