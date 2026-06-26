"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Shuffle } from "lucide-react";
import { toast } from "sonner";

interface RandomPollButtonProps {
  onRandom: () => Promise<void>;
  disabled?: boolean;
}

export function RandomPollButton({ onRandom, disabled }: RandomPollButtonProps) {
  const [loading, setLoading] = useState(false);
  const reduced = useReducedMotion();

  const handleClick = async () => {
    setLoading(true);
    try {
      await onRandom();
    } catch {
      toast.error("Couldn't load random poll");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label="Load a random poll"
      aria-busy={loading}
      className="group flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[0.875rem] font-medium text-white/32 transition-all duration-200 hover:text-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400/60 disabled:pointer-events-none disabled:opacity-40"
      whileTap={reduced ? {} : { scale: 0.97 }}
    >
      <Shuffle
        className="size-3.5 transition-transform duration-300 group-hover:rotate-180"
        aria-hidden="true"
      />
      {loading ? "Loading…" : "Random Poll"}
    </motion.button>
  );
}
