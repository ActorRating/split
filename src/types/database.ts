export type VoteChoice = "A" | "B";
export type PollStatus = "draft" | "scheduled" | "published";
export type SuggestionStatus = "pending" | "approved" | "rejected";

// ─── Database row types ───────────────────────────────────────

export interface PollRow {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  emoji_a: string;
  emoji_b: string;
  /** Null for draft / scheduled polls without an assigned date */
  date: string | null;
  status: PollStatus;
  scheduled_for: string | null;
  tags: string[];
  difficulty: number;
  created_at: string;
}

export interface PollStatsRow {
  poll_id: string;
  votes_a: number;
  votes_b: number;
  total_votes: number;
  updated_at: string;
}

export interface VoteRow {
  id: string;
  user_id: string;
  poll_id: string;
  choice: VoteChoice;
  created_at: string;
}

export interface StreakRow {
  user_id: string;
  current_streak: number;
  last_vote_date: string | null;
  updated_at: string;
}

export interface AdminUserRow {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface PollSuggestionRow {
  id: string;
  question: string;
  option_a: string | null;
  option_b: string | null;
  submitted_by: string | null;
  status: SuggestionStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── API response shapes ──────────────────────────────────────

export interface PollResponse {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  emojiA: string;
  emojiB: string;
  date: string | null;
  status: PollStatus;
  tags: string[];
  difficulty: number;
  votesA: number;
  votesB: number;
  totalVotes: number;
  percentages: { a: number; b: number };
}

export interface VoteStatusResponse {
  hasVoted: boolean;
  choice: VoteChoice | null;
  streak: number;
}

export interface AdminStatsResponse {
  totalPolls: number;
  publishedPolls: number;
  scheduledPolls: number;
  draftPolls: number;
  pendingSuggestions: number;
  todayVotes: number;
}

export interface PollSuggestionResponse {
  id: string;
  question: string;
  optionA: string | null;
  optionB: string | null;
  submittedBy: string | null;
  status: SuggestionStatus;
  adminNotes: string | null;
  createdAt: string;
}
