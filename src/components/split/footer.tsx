"use client";

import { motion } from "framer-motion";

export function Footer() {
  return (
    <motion.footer
      className="space-y-1.5 pb-4 text-center"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.1 }}
      role="contentinfo"
    >
      <p className="text-[0.8125rem] text-white/22">Made for fun.</p>
      <p className="text-[0.75rem] text-white/16">
        A new impossible question every day.
      </p>
    </motion.footer>
  );
}
