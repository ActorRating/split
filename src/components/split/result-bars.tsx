"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCountUp } from "@/hooks/use-count-up";
import type { PollOption } from "@/lib/polls";

const EASE = [0.16, 1, 0.3, 1] as const;

const BAR_COLORS = [
  { track: "rgba(168,85,247,0.1)", fill: "linear-gradient(90deg, rgba(168,85,247,0.75), rgba(168,85,247,0.45))" },
  { track: "rgba(59,130,246,0.1)",  fill: "linear-gradient(90deg, rgba(59,130,246,0.75), rgba(59,130,246,0.45))" },
] as const;

interface AnimatedPercentProps {
  value: number;
  show: boolean;
}

function AnimatedPercent({ value, show }: AnimatedPercentProps) {
  const reduced = useReducedMotion();
  const animated = useCountUp(value, reduced ? 0 : 1100, show);
  return <>{Math.round(animated)}%</>;
}

interface AnimatedVotesProps {
  value: number;
  show: boolean;
}

function AnimatedVotes({ value, show }: AnimatedVotesProps) {
  const reduced = useReducedMotion();
  const animated = useCountUp(value, reduced ? 0 : 1400, show);
  return <>{Math.round(animated).toLocaleString("en-US")}</>;
}

interface ResultBarProps {
  option: PollOption;
  percent: number;
  index: number;
  show: boolean;
}

function ResultBar({ option, percent, index, show }: ResultBarProps) {
  const reduced = useReducedMotion();
  const colors = BAR_COLORS[index];

  return (
    <motion.div
      className="space-y-2.5"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.13, duration: 0.55, ease: EASE }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-white/78 sm:text-[0.9375rem]">
          <span
            className="shrink-0 text-base sm:text-lg"
            role="img"
            aria-hidden="true"
          >
            {option.emoji}
          </span>
          <span className="truncate">{option.label}</span>
        </span>

        <motion.span
          className="shrink-0 tabular-nums text-sm font-semibold text-white/55 sm:text-[0.9375rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: show ? 1 : 0 }}
          transition={{ delay: 0.45 + index * 0.1, duration: 0.4 }}
          aria-label={`${Math.round(percent)} percent`}
        >
          <AnimatedPercent value={percent} show={show} />
        </motion.span>
      </div>

      {/* Track + fill */}
      <div
        className="h-2 overflow-hidden rounded-full sm:h-2.5"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ backgroundColor: colors.track }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: colors.fill }}
          initial={{ width: "0%" }}
          animate={{ width: show ? `${percent}%` : "0%" }}
          transition={{
            duration: reduced ? 0 : 1.1,
            delay: reduced ? 0 : 0.18 + index * 0.13,
            ease: EASE,
          }}
        />
      </div>
    </motion.div>
  );
}

interface ResultBarsProps {
  options: [PollOption, PollOption];
  percentA: number;
  percentB: number;
  totalVotes: number;
  show: boolean;
}

export function ResultBars({ options, percentA, percentB, totalVotes, show }: ResultBarsProps) {
  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.35 }}
      aria-live="polite"
      aria-atomic="true"
    >
      <ResultBar option={options[0]} percent={percentA} index={0} show={show} />
      <ResultBar option={options[1]} percent={percentB} index={1} show={show} />

      <motion.p
        className="pt-1 text-center text-xs text-white/30 tabular-nums"
        initial={{ opacity: 0 }}
        animate={{ opacity: show ? 1 : 0 }}
        transition={{ delay: 0.85, duration: 0.4 }}
        aria-label={`Total votes: ${totalVotes.toLocaleString()}`}
      >
        <AnimatedVotes value={totalVotes} show={show} /> votes
      </motion.p>
    </motion.div>
  );
}
