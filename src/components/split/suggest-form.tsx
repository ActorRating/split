"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Lightbulb, Send } from "lucide-react";
import { toast } from "sonner";
import { getAuthFetchHeaders } from "@/lib/supabase/auth-headers";

const EASE = [0.16, 1, 0.3, 1] as const;

export function SuggestForm() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const reduced = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim().length < 10) {
      toast.error("Question too short", { description: "At least 10 characters." });
      return;
    }

    setSubmitting(true);
    try {
      const headers = await getAuthFetchHeaders();
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers,
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to submit");
      }

      toast.success("Submitted!", { description: "Thanks for the idea." });
      setQuestion("");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="suggest-form"
        className="group flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[0.875rem] font-medium text-white/32 transition-all duration-200 hover:text-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400/60"
      >
        <Lightbulb className="size-3.5" aria-hidden="true" />
        Suggest a Question
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-white/25"
        >
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.form
            id="suggest-form"
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.022]"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduced ? 0 : 0.32, ease: EASE }}
            aria-label="Suggest a poll question"
          >
            <div className="p-4 pb-3">
              <label htmlFor="suggest-input" className="sr-only">
                Your question idea
              </label>
              <textarea
                id="suggest-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Would you rather…"
                maxLength={280}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[0.9rem] text-white/80 placeholder:text-white/22 outline-none transition-colors duration-200 focus:border-white/[0.14] focus:bg-white/[0.04]"
              />
              <p className="mt-1.5 text-right text-[0.75rem] text-white/20 tabular-nums">
                {question.length}/280
              </p>
            </div>

            <div className="border-t border-white/[0.05] px-4 py-3">
              <button
                type="submit"
                disabled={submitting || question.trim().length < 10}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.06] py-2.5 text-[0.875rem] font-medium text-white/70 transition-all hover:bg-white/[0.1] hover:text-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400/60 disabled:pointer-events-none disabled:opacity-40"
              >
                <Send className="size-3.5" aria-hidden="true" />
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
