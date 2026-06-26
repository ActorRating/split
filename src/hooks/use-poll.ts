"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getAuthFetchHeaders } from "@/lib/supabase/auth-headers";
import { choiceToIndex, indexToChoice } from "@/lib/polls";
import type { PollResponse, VoteChoice } from "@/types/database";
import { useAuth } from "@/components/split/auth-provider";

export interface PollState {
  poll: PollResponse | null;
  hasVoted: boolean;
  choice: VoteChoice | null;
  streak: number;
  isReady: boolean;
  isVoting: boolean;
  percentA: number;
  percentB: number;
  totalVotes: number;
}

export function usePoll() {
  const { isReady: authReady, userId } = useAuth();
  const [state, setState] = useState<PollState>({
    poll: null,
    hasVoted: false,
    choice: null,
    streak: 0,
    isReady: false,
    isVoting: false,
    percentA: 50,
    percentB: 50,
    totalVotes: 0,
  });

  const pollIdRef = useRef<string | null>(null);

  const applyPoll = useCallback((poll: PollResponse) => {
    pollIdRef.current = poll.id;
    setState((prev) => ({
      ...prev,
      poll,
      percentA: poll.percentages.a,
      percentB: poll.percentages.b,
      totalVotes: poll.totalVotes,
    }));
  }, []);

  const fetchPoll = useCallback(async () => {
    const headers = await getAuthFetchHeaders();
    const [pollRes, statusRes] = await Promise.all([
      fetch("/api/poll/today"),
      fetch("/api/vote/status", { headers }),
    ]);

    if (pollRes.status === 503) {
      setState((prev) => ({ ...prev, poll: null, isReady: true }));
      return;
    }

    if (!pollRes.ok) throw new Error("Failed to fetch poll");

    const poll: PollResponse = await pollRes.json();
    const status = statusRes.ok
      ? await statusRes.json()
      : { hasVoted: false, choice: null, streak: 0 };

    applyPoll(poll);
    setState((prev) => ({
      ...prev,
      hasVoted: status.hasVoted,
      choice: status.choice,
      streak: status.streak ?? 0,
      isReady: true,
    }));
  }, [applyPoll]);

  // Initial fetch once auth is ready
  useEffect(() => {
    if (!authReady) return;
    fetchPoll().catch(console.error);
  }, [authReady, fetchPoll]);

  // Supabase Realtime: subscribe to poll_stats updates
  useEffect(() => {
    const pollId = pollIdRef.current;
    if (!pollId) return;

    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`poll-stats-${pollId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "poll_stats",
          filter: `poll_id=eq.${pollId}`,
        },
        (payload) => {
          const stats = payload.new as {
            votes_a: number;
            votes_b: number;
            total_votes: number;
          };
          const total = stats.total_votes || stats.votes_a + stats.votes_b;
          const percentA = total > 0 ? (stats.votes_a / total) * 100 : 50;

          setState((prev) => ({
            ...prev,
            percentA,
            percentB: 100 - percentA,
            totalVotes: total,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.poll?.id]);

  const vote = useCallback(
    async (index: 0 | 1) => {
      if (!userId) {
        toast.error("Still signing you in…", {
          description: "Please try again in a moment.",
        });
        return;
      }

      const choice = indexToChoice(index);

      setState((prev) => {
        if (prev.hasVoted || prev.isVoting || !prev.poll) return prev;

        // Optimistic update
        const votesA =
          prev.poll.votesA + (choice === "A" ? 1 : 0);
        const votesB =
          prev.poll.votesB + (choice === "B" ? 1 : 0);
        const total = votesA + votesB;
        const percentA = total > 0 ? (votesA / total) * 100 : 50;

        return {
          ...prev,
          isVoting: true,
          hasVoted: true,
          choice,
          percentA,
          percentB: 100 - percentA,
          totalVotes: total,
        };
      });

      try {
        const headers = await getAuthFetchHeaders();
        const res = await fetch("/api/vote", {
          method: "POST",
          headers,
          body: JSON.stringify({ choice }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 409) {
            // Already voted — sync state
            setState((prev) => ({
              ...prev,
              hasVoted: true,
              choice: data.choice,
              isVoting: false,
            }));
            return;
          }
          throw new Error(data.error ?? "Vote failed");
        }

        setState((prev) => ({
          ...prev,
          isVoting: false,
          streak: data.streak ?? prev.streak,
          percentA: data.percentages.a,
          percentB: data.percentages.b,
          totalVotes: data.totalVotes,
          poll: prev.poll
            ? {
                ...prev.poll,
                votesA: data.votesA,
                votesB: data.votesB,
                totalVotes: data.totalVotes,
                percentages: data.percentages,
              }
            : null,
        }));
      } catch (err) {
        console.error("[usePoll] vote error", err);
        toast.error("Vote failed", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
        // Rollback optimistic update and sync from server
        await fetchPoll();
        setState((prev) => ({ ...prev, isVoting: false }));
      }
    },
    [fetchPoll, userId]
  );

  const loadRandomPoll = useCallback(async () => {
    setState((prev) => ({ ...prev, isReady: false }));
    try {
      const res = await fetch("/api/poll/random");
      if (!res.ok) throw new Error("Failed to load random poll");
      const poll: PollResponse = await res.json();
      applyPoll(poll);
      setState((prev) => ({
        ...prev,
        hasVoted: false,
        choice: null,
        isReady: true,
        percentA: poll.percentages.a,
        percentB: poll.percentages.b,
        totalVotes: poll.totalVotes,
      }));
    } catch (err) {
      console.error(err);
      setState((prev) => ({ ...prev, isReady: true }));
    }
  }, [applyPoll]);

  const loadTodaysPoll = useCallback(async () => {
    setState((prev) => ({ ...prev, isReady: false }));
    await fetchPoll();
  }, [fetchPoll]);

  return {
    ...state,
    vote,
    loadRandomPoll,
    loadTodaysPoll,
    choiceIndex: choiceToIndex(state.choice),
  };
}
