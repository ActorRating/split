"use client";

import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return (
    <header className="text-center" role="banner">
      {/* Logo */}
      <motion.div
        className="relative inline-block"
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        {/* Halo glow — layered for depth */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 -z-10 h-40 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(ellipse, rgba(168,85,247,0.25) 0%, rgba(59,130,246,0.15) 45%, transparent 75%)",
            filter: "blur(32px)",
          }}
        />

        <h1
          className="select-none text-[4.5rem] font-bold leading-none tracking-[-0.04em] sm:text-[6rem]"
          style={{
            background:
              "linear-gradient(170deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.82) 55%, rgba(255,255,255,0.5) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Split
        </h1>
      </motion.div>

      {/* Tagline */}
      <motion.p
        className="mt-3 text-[0.9375rem] font-normal tracking-wide text-white/38 sm:mt-4 sm:text-base"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.18, ease: EASE }}
      >
        The internet can&apos;t agree.
      </motion.p>
    </header>
  );
}
