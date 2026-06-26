import type { PollResponse, PollRow, PollStatsRow } from "@/types/database";

export interface PollOption {
  emoji: string;
  label: string;
}

export interface SeedPoll {
  question: string;
  optionA: string;
  optionB: string;
  emojiA: string;
  emojiB: string;
}

/** Fallback poll pool used when the DB has no poll for today */
export const SEED_POLLS: SeedPoll[] = [
  {
    question: "Fight 100 ducks or 1 horse-sized duck?",
    optionA: "Fight one horse-sized duck",
    optionB: "Fight one hundred ducks",
    emojiA: "🐴",
    emojiB: "🦆",
  },
  {
    question: "Never use YouTube again or never use Spotify?",
    optionA: "Never use YouTube again",
    optionB: "Never use Spotify",
    emojiA: "▶️",
    emojiB: "🎵",
  },
  {
    question: "Live without music or live without movies?",
    optionA: "Live without music",
    optionB: "Live without movies",
    emojiA: "🎶",
    emojiB: "🎬",
  },
  {
    question: "Unlimited money but no friends or unlimited friends but no money?",
    optionA: "Unlimited money, no friends",
    optionB: "Unlimited friends, no money",
    emojiA: "💰",
    emojiB: "👥",
  },
  {
    question: "Only pizza forever or only burgers forever?",
    optionA: "Only pizza forever",
    optionB: "Only burgers forever",
    emojiA: "🍕",
    emojiB: "🍔",
  },
];

/** Returns today's date as YYYY-MM-DD (UTC) */
export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Pick a seed poll deterministically for a given date */
export function getSeedPollForDate(date: string): SeedPoll {
  const d = new Date(date + "T00:00:00Z");
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0));
  const dayOfYear = Math.floor(
    (d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return SEED_POLLS[dayOfYear % SEED_POLLS.length];
}

/** Compute percentages from raw vote counts */
export function computePercentages(
  votesA: number,
  votesB: number
): { a: number; b: number } {
  const total = votesA + votesB;
  if (total === 0) return { a: 50, b: 50 };
  const a = (votesA / total) * 100;
  return { a, b: 100 - a };
}

/**
 * Divisiveness score: 1 = perfectly split, 0 = unanimous
 * score = 1 - abs(0.5 - ratio) * 2
 */
export function getDivisivenessScore(votesA: number, votesB: number): number {
  const total = votesA + votesB;
  if (total === 0) return 0;
  const ratio = votesA / total;
  return 1 - Math.abs(0.5 - ratio) * 2;
}

export function getDivisivenessLabel(score: number): {
  emoji: string;
  label: string;
} {
  if (score >= 0.85) return { emoji: "🔥", label: "Highly Divisive" };
  if (score >= 0.55) return { emoji: "⚖️", label: "Controversial" };
  return { emoji: "📊", label: "One-Sided" };
}

export function pollRowToResponse(
  poll: PollRow,
  stats?: PollStatsRow | null
): PollResponse {
  const votesA = stats?.votes_a ?? 0;
  const votesB = stats?.votes_b ?? 0;
  const totalVotes = stats?.total_votes ?? votesA + votesB;
  const percentages = computePercentages(votesA, votesB);

  return {
    id: poll.id,
    question: poll.question,
    optionA: poll.option_a,
    optionB: poll.option_b,
    emojiA: poll.emoji_a,
    emojiB: poll.emoji_b,
    date: poll.date,
    status: poll.status ?? "published",
    tags: poll.tags ?? [],
    difficulty: poll.difficulty ?? 3,
    votesA,
    votesB,
    totalVotes,
    percentages,
  };
}

export function pollToOptions(poll: PollResponse): [PollOption, PollOption] {
  return [
    { emoji: poll.emojiA, label: poll.optionA },
    { emoji: poll.emojiB, label: poll.optionB },
  ];
}

export function choiceToIndex(choice: "A" | "B" | null): 0 | 1 | null {
  if (choice === "A") return 0;
  if (choice === "B") return 1;
  return null;
}

export function indexToChoice(index: 0 | 1): "A" | "B" {
  return index === 0 ? "A" : "B";
}

/** All available tag options for the content system */
export const POLL_TAGS = [
  "food",
  "philosophy",
  "funny",
  "relationships",
  "tech",
  "lifestyle",
  "absurd",
  "sports",
] as const;

export type PollTag = (typeof POLL_TAGS)[number];
