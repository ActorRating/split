"use client";

import { motion } from "framer-motion";
import { BackgroundEffects } from "@/components/split/background-effects";
import { Footer } from "@/components/split/footer";
import { Hero } from "@/components/split/hero";
import { PollCard } from "@/components/split/poll-card";
import { PreviousPolls } from "@/components/split/previous-polls";
import { RandomPollButton } from "@/components/split/random-poll-button";
import { ShareButton } from "@/components/split/share-button";
import { StatsSection } from "@/components/split/stats-section";
import { SuggestForm } from "@/components/split/suggest-form";
import { ConfigBanner } from "@/components/split/config-banner";
import { AuthErrorBanner } from "@/components/split/auth-error-banner";
import { useAuth } from "@/components/split/auth-provider";
import { usePoll } from "@/hooks/use-poll";
import { getTodayKey } from "@/lib/polls";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Staggered fade-up for sections below the card */
function FadeUp({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function SplitApp() {
  const { isConfigured, authError } = useAuth();
  const {
    poll,
    hasVoted,
    choiceIndex,
    percentA,
    percentB,
    totalVotes,
    streak,
    isReady,
    isVoting,
    vote,
    loadRandomPoll,
    loadTodaysPoll,
  } = usePoll();

  const isTodaysPoll = poll?.date === getTodayKey();

  const userPercent =
    choiceIndex !== null
      ? choiceIndex === 0
        ? percentA
        : percentB
      : 0;

  return (
    <div className="relative min-h-screen">
      <BackgroundEffects />

      <main
        className="relative z-10 mx-auto flex min-h-screen max-w-[680px] flex-col justify-center px-5 py-20 sm:px-8 sm:py-28"
        id="main-content"
      >
        <div className="flex flex-col gap-10 sm:gap-14">

          <Hero />

          {/* Config / auth banners */}
          {!isConfigured && isReady && (
            <FadeUp delay={0.1}>
              <ConfigBanner />
            </FadeUp>
          )}
          {authError && (
            <FadeUp delay={0.1}>
              <AuthErrorBanner message={authError} />
            </FadeUp>
          )}

          {/* Poll card */}
          <PollCard
            poll={poll ?? undefined}
            hasVoted={hasVoted || !isTodaysPoll}
            percentA={percentA}
            percentB={percentB}
            totalVotes={totalVotes}
            isReady={isReady}
            isVoting={isVoting}
            onVote={vote}
            readOnly={!isTodaysPoll}
          />

          {/* No poll fallback */}
          {!poll && isReady && isConfigured && (
            <FadeUp>
              <p className="text-center text-sm text-white/35">
                Unable to load today&apos;s poll. Refresh the page.
              </p>
            </FadeUp>
          )}

          {/* Post-vote stats */}
          <StatsSection
            hasVoted={hasVoted && isTodaysPoll}
            choice={choiceIndex}
            percentA={percentA}
            percentB={percentB}
            totalVotes={totalVotes}
            streak={streak}
            votesA={poll?.votesA ?? 0}
            votesB={poll?.votesB ?? 0}
          />

          {/* Share */}
          {hasVoted && poll && isTodaysPoll && (
            <FadeUp delay={0.05}>
              <ShareButton
                question={poll.question}
                userPercent={userPercent}
              />
            </FadeUp>
          )}

          {/* Back-to-today */}
          {!isTodaysPoll && poll && (
            <FadeUp>
              <motion.button
                type="button"
                onClick={loadTodaysPoll}
                className="group mx-auto flex items-center gap-1.5 text-sm text-white/35 transition-colors hover:text-white/65 focus-visible:text-white/65"
                whileTap={{ scale: 0.97 }}
                aria-label="Back to today's poll"
              >
                <span className="transition-transform group-hover:-translate-x-0.5">←</span>
                Back to today&apos;s poll
              </motion.button>
            </FadeUp>
          )}

          {/* Utility actions */}
          <div className="flex flex-col gap-3">
            <RandomPollButton
              onRandom={loadRandomPoll}
              disabled={!isReady || isVoting}
            />
            <SuggestForm />
          </div>

          {/* Archive */}
          <PreviousPolls />

          <Footer />
        </div>
      </main>
    </div>
  );
}
