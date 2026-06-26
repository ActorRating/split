"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  question: string;
  userPercent: number;
}

export function ShareButton({ question, userPercent }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const reduced = useReducedMotion();

  const shareText = `I voted on Split: "${question}" — ${Math.round(userPercent)}% agreed with me. split.app`;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2400);
    } catch {
      toast.error("Couldn't copy — try manually.");
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleShare}
      aria-label="Share today's poll result"
      className="group relative w-full overflow-hidden rounded-[1rem] border border-white/[0.08] bg-white/[0.035] px-5 py-3.5 text-center text-[0.9375rem] font-[490] text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.13] hover:bg-white/[0.06] hover:text-white/95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400/60"
      whileHover={reduced ? {} : { scale: 1.012 }}
      whileTap={reduced ? {} : { scale: 0.978 }}
      transition={{ duration: 0.2 }}
    >
      {/* Hover shimmer */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-purple-500/[0.06] via-blue-500/[0.04] to-pink-500/[0.06] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      <span className="relative flex items-center justify-center gap-2.5">
        <motion.span
          key={copied ? "check" : "share"}
          initial={{ opacity: 0, scale: 0.75, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          {copied ? (
            <Check className="size-4 text-green-400" strokeWidth={2.5} />
          ) : (
            <Share2 className="size-4 transition-transform duration-300 group-hover:scale-110" />
          )}
        </motion.span>
        {copied ? "Copied!" : "Share Today's Poll"}
      </span>
    </motion.button>
  );
}
