"use client";

import { motion } from "framer-motion";

interface AuthErrorBannerProps {
  message: string;
}

export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  return (
    <motion.div
      role="alert"
      className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-5 py-4 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-[0.9rem] font-medium text-red-200/80">
        Sign-in required to vote
      </p>
      <p className="mt-1 text-[0.8125rem] text-red-200/45">{message}</p>
    </motion.div>
  );
}
