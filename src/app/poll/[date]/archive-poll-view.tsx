"use client";

import { motion } from "framer-motion";
import { ResultBars } from "@/components/split/result-bars";
import { pollToOptions } from "@/lib/polls";
import type { PollResponse } from "@/types/database";

const EASE = [0.16, 1, 0.3, 1] as const;

interface ArchivePollViewProps {
  poll: PollResponse;
}

export function ArchivePollView({ poll }: ArchivePollViewProps) {
  const options = pollToOptions(poll);

  return (
    <motion.div
      className="gradient-border-card"
      initial={{ opacity: 0, y: 24, scale: 0.975 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <div className="flex flex-col gap-7 rounded-[calc(1.75rem-1px)] bg-[#101010]/95 p-8 backdrop-blur-2xl sm:p-10">
        <h1 className="text-center text-xl font-[570] leading-[1.35] tracking-[-0.022em] text-white/94 sm:text-2xl">
          {poll.question}
        </h1>

        <div className="text-center">
          <span className="inline-block rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1 text-[0.75rem] font-medium uppercase tracking-widest text-white/30">
            Archive
          </span>
        </div>

        <ResultBars
          options={options}
          percentA={poll.percentages.a}
          percentB={poll.percentages.b}
          totalVotes={poll.totalVotes}
          show
        />
      </div>
    </motion.div>
  );
}
