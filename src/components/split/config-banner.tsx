"use client";

import { motion } from "framer-motion";

export function ConfigBanner() {
  return (
    <motion.div
      role="alert"
      className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] px-5 py-4 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-[0.9rem] font-medium text-amber-200/85">
        Supabase not configured
      </p>
      <p className="mt-1 text-[0.8125rem] text-amber-200/45">
        Add{" "}
        <code className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-[0.75rem]">
          NEXT_PUBLIC_SUPABASE_URL
        </code>{" "}
        and{" "}
        <code className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-[0.75rem]">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{" "}
        to <code className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-[0.75rem]">.env.local</code>{" "}
        and restart.
      </p>
    </motion.div>
  );
}
