"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { PollOption } from "@/lib/polls";

interface VoteButtonProps {
  option: PollOption;
  index: 0 | 1;
  onVote: (choice: 0 | 1) => void;
  disabled?: boolean;
}

const EASE = [0.16, 1, 0.3, 1] as const;

const ACCENT = [
  {
    border: "rgba(168,85,247,0.14)",
    borderHover: "rgba(168,85,247,0.32)",
    glow: "rgba(168,85,247,0.12)",
    glowHover: "rgba(168,85,247,0.22)",
    bg: "rgba(168,85,247,0.04)",
    bgHover: "rgba(168,85,247,0.09)",
  },
  {
    border: "rgba(59,130,246,0.14)",
    borderHover: "rgba(59,130,246,0.32)",
    glow: "rgba(59,130,246,0.12)",
    glowHover: "rgba(59,130,246,0.22)",
    bg: "rgba(59,130,246,0.04)",
    bgHover: "rgba(59,130,246,0.09)",
  },
] as const;

export function VoteButton({ option, index, onVote, disabled }: VoteButtonProps) {
  const reduced = useReducedMotion();
  const accent = ACCENT[index];

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => onVote(index)}
      aria-label={`Vote for: ${option.label}`}
      className="group relative w-full overflow-hidden rounded-[1.1rem] p-px text-left outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808] disabled:pointer-events-none disabled:opacity-50"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 + index * 0.12, duration: 0.65, ease: EASE }}
      whileHover={reduced ? {} : { scale: 1.018, rotate: index === 0 ? -0.4 : 0.4 }}
      whileTap={reduced ? {} : { scale: 0.975 }}
      style={{
        background: `linear-gradient(135deg, ${accent.border}, transparent 60%)`,
        boxShadow: `0 0 0 1px ${accent.border}`,
      }}
      onMouseEnter={(e) => {
        if (reduced) return;
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          `0 0 0 1px ${accent.borderHover}, 0 8px 32px -8px ${accent.glowHover}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          `0 0 0 1px ${accent.border}`;
      }}
    >
      {/* Inner surface */}
      <div
        className="relative flex flex-col rounded-[calc(1.1rem-1px)] p-6 transition-colors duration-300 sm:p-8"
        style={{ backgroundColor: accent.bg }}
      >
        {/* Hover shimmer layer */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />

        <span
          className="mb-3 block text-4xl transition-transform duration-300 group-hover:scale-110 sm:text-[2.75rem]"
          role="img"
          aria-hidden="true"
        >
          {option.emoji}
        </span>

        <span className="block text-[1.0625rem] font-[490] leading-snug tracking-[-0.01em] text-white/88 transition-colors duration-300 group-hover:text-white sm:text-[1.125rem]">
          {option.label}
        </span>
      </div>
    </motion.button>
  );
}
