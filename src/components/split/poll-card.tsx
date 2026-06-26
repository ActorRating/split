"use client";

import { useRef } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { VoteButton } from "./vote-button";
import { ResultBars } from "./result-bars";
import { pollToOptions } from "@/lib/polls";
import type { PollResponse } from "@/types/database";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Skeleton that matches the poll card layout exactly — no layout shift */
function PollCardSkeleton() {
  return (
    <div
      className="gradient-border-card"
      aria-busy="true"
      aria-label="Loading today's poll"
    >
      <div className="flex flex-col gap-6 rounded-[calc(1.75rem-1px)] bg-[#101010] p-8 sm:p-10">
        {/* Question skeleton */}
        <div className="flex flex-col items-center gap-2.5 pb-2">
          <div className="skeleton h-5 w-4/5 rounded-lg" />
          <div className="skeleton h-5 w-3/5 rounded-lg" />
        </div>
        {/* Button skeletons */}
        <div className="grid gap-4">
          <div className="skeleton h-[108px] rounded-[1.1rem] sm:h-[120px]" />
          <div className="skeleton h-[108px] rounded-[1.1rem] sm:h-[120px]" />
        </div>
      </div>
    </div>
  );
}

interface PollCardProps {
  poll?: PollResponse;
  hasVoted: boolean;
  percentA: number;
  percentB: number;
  totalVotes: number;
  isReady: boolean;
  isVoting?: boolean;
  onVote: (choice: 0 | 1) => void;
  readOnly?: boolean;
}

export function PollCard({
  poll,
  hasVoted,
  percentA,
  percentB,
  totalVotes,
  isReady,
  isVoting,
  onVote,
  readOnly,
}: PollCardProps) {
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  /* Subtle mouse-parallax tilt — desktop only, motion-safe */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [2.5, -2.5]), {
    stiffness: 120,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), {
    stiffness: 120,
    damping: 24,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  if (!isReady || !poll) {
    return <PollCardSkeleton />;
  }

  const options = pollToOptions(poll);

  return (
    <motion.div
      ref={cardRef}
      className="gradient-border-card"
      initial={{ opacity: 0, y: 28, scale: 0.975 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.85, delay: 0.18, ease: EASE }}
      style={reduced ? {} : { rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Card surface */}
      <div className="flex flex-col gap-7 rounded-[calc(1.75rem-1px)] bg-[#101010]/95 p-8 backdrop-blur-2xl sm:p-10">

        {/* Question */}
        <motion.h2
          className="text-center text-xl font-[570] leading-[1.35] tracking-[-0.022em] text-white/94 sm:text-2xl"
          layout
          role="heading"
          aria-level={2}
        >
          {poll.question}
        </motion.h2>

        {readOnly && (
          <p className="text-center text-xs font-medium uppercase tracking-widest text-white/25">
            Archive results
          </p>
        )}

        {/* Buttons ↔ results */}
        <AnimatePresence mode="wait">
          {!hasVoted ? (
            <motion.div
              key="buttons"
              className="grid gap-3 sm:gap-4"
              exit={{
                opacity: 0,
                scale: 0.96,
                filter: reduced ? undefined : "blur(6px)",
              }}
              transition={{ duration: 0.3, ease: "easeIn" }}
            >
              <VoteButton option={options[0]} index={0} onVote={onVote} disabled={isVoting} />
              <VoteButton option={options[1]} index={1} onVote={onVote} disabled={isVoting} />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <ResultBars
                options={options}
                percentA={percentA}
                percentB={percentB}
                totalVotes={totalVotes}
                show={hasVoted}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
