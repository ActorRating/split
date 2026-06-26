"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Floating gradient blobs + noise grain. Respects prefers-reduced-motion. */
export function BackgroundEffects() {
  const reduced = useReducedMotion();

  // Blobs are static when motion is reduced
  const sharedTransition = (duration: number) =>
    reduced
      ? { duration: 0 }
      : { duration, repeat: Infinity, ease: "easeInOut" as const };

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Film grain */}
      <div className="noise-overlay absolute inset-0 opacity-[0.028]" />

      {/* Purple blob — top left */}
      <motion.div
        className="absolute -left-48 -top-16 h-[520px] w-[520px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={reduced ? {} : {
          x: [0, 48, -16, 0],
          y: [0, -24, 32, 0],
          scale: [1, 1.08, 0.96, 1],
        }}
        transition={sharedTransition(28)}
      />

      {/* Blue blob — top right */}
      <motion.div
        className="absolute -right-32 top-1/4 h-[460px] w-[460px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.13) 0%, transparent 70%)",
          filter: "blur(90px)",
        }}
        animate={reduced ? {} : {
          x: [0, -40, 24, 0],
          y: [0, 36, -20, 0],
          scale: [1, 0.92, 1.06, 1],
        }}
        transition={sharedTransition(24)}
      />

      {/* Pink blob — bottom center */}
      <motion.div
        className="absolute bottom-0 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.09) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
        animate={reduced ? {} : {
          x: [0, 32, -48, 0],
          y: [0, -32, 16, 0],
        }}
        transition={sharedTransition(32)}
      />
    </div>
  );
}
