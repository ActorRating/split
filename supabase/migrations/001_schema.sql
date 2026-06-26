-- Split v2 schema
-- Run in Supabase SQL Editor or via CLI

-- Polls: one per calendar day
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  emoji_a text NOT NULL DEFAULT '🔵',
  emoji_b text NOT NULL DEFAULT '🟣',
  date date UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Individual votes (one per user per poll)
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  choice text NOT NULL CHECK (choice IN ('A', 'B')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, poll_id)
);

-- Cached aggregate stats (updated via trigger)
CREATE TABLE IF NOT EXISTS poll_stats (
  poll_id uuid PRIMARY KEY REFERENCES polls(id) ON DELETE CASCADE,
  votes_a int NOT NULL DEFAULT 0,
  votes_b int NOT NULL DEFAULT 0,
  total_votes int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User-submitted poll ideas
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Daily voting streaks
CREATE TABLE IF NOT EXISTS streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak int NOT NULL DEFAULT 0,
  last_vote_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-update poll_stats when a vote is inserted
CREATE OR REPLACE FUNCTION update_poll_stats_on_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO poll_stats (poll_id, votes_a, votes_b, total_votes)
  VALUES (
    NEW.poll_id,
    CASE WHEN NEW.choice = 'A' THEN 1 ELSE 0 END,
    CASE WHEN NEW.choice = 'B' THEN 1 ELSE 0 END,
    1
  )
  ON CONFLICT (poll_id) DO UPDATE SET
    votes_a = poll_stats.votes_a + CASE WHEN NEW.choice = 'A' THEN 1 ELSE 0 END,
    votes_b = poll_stats.votes_b + CASE WHEN NEW.choice = 'B' THEN 1 ELSE 0 END,
    total_votes = poll_stats.total_votes + 1,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_vote_insert ON votes;
CREATE TRIGGER on_vote_insert
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_stats_on_vote();

-- Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Polls: anyone can read
CREATE POLICY "polls_public_read" ON polls
  FOR SELECT USING (true);

-- Poll stats: anyone can read
CREATE POLICY "poll_stats_public_read" ON poll_stats
  FOR SELECT USING (true);

-- Votes: users read own votes
CREATE POLICY "votes_select_own" ON votes
  FOR SELECT USING (auth.uid() = user_id);

-- Votes: users insert own votes
CREATE POLICY "votes_insert_own" ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Suggestions: authenticated users can insert
CREATE POLICY "suggestions_insert" ON suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Streaks: users read/update own
CREATE POLICY "streaks_select_own" ON streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "streaks_insert_own" ON streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streaks_update_own" ON streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for live vote updates
ALTER PUBLICATION supabase_realtime ADD TABLE poll_stats;

-- Seed historical polls (past 11 days + today)
INSERT INTO polls (question, option_a, option_b, emoji_a, emoji_b, date) VALUES
  ('Would you rather…', 'Never fly again', 'Never drive again', '✈️', '🚗', CURRENT_DATE - 11),
  ('Would you rather…', 'Always be too hot', 'Always be too cold', '🔥', '❄️', CURRENT_DATE - 10),
  ('Would you rather…', 'Read everyone''s mind', 'Have everyone read yours', '📖', '💭', CURRENT_DATE - 9),
  ('Would you rather…', 'Relive the past', 'See the future', '⏪', '⏩', CURRENT_DATE - 8),
  ('Would you rather…', 'No WiFi for a week', 'No food for a week', '📶', '🍽️', CURRENT_DATE - 7),
  ('Would you rather…', 'Be famous but hated', 'Be unknown but loved', '⭐', '🕵️', CURRENT_DATE - 6),
  ('Never use YouTube again or never use Spotify?', 'Never use YouTube again', 'Never use Spotify', '▶️', '🎵', CURRENT_DATE - 5),
  ('Live without music or live without movies?', 'Live without music', 'Live without movies', '🎶', '🎬', CURRENT_DATE - 4),
  ('Have unlimited money but no friends or unlimited friends but no money?', 'Unlimited money, no friends', 'Unlimited friends, no money', '💰', '👥', CURRENT_DATE - 3),
  ('Only pizza forever or only burgers forever?', 'Only pizza forever', 'Only burgers forever', '🍕', '🍔', CURRENT_DATE - 2),
  ('Fight 100 ducks or 1 horse-sized duck?', 'Fight one horse-sized duck', 'Fight one hundred ducks', '🐴', '🦆', CURRENT_DATE - 1),
  ('Fight 100 ducks or 1 horse-sized duck?', 'Fight one horse-sized duck', 'Fight one hundred ducks', '🐴', '🦆', CURRENT_DATE)
ON CONFLICT (date) DO NOTHING;

-- Initialize stats rows for seeded polls
INSERT INTO poll_stats (poll_id, votes_a, votes_b, total_votes)
SELECT p.id,
  floor(random() * 50000 + 10000)::int,
  floor(random() * 50000 + 10000)::int,
  0
FROM polls p
ON CONFLICT (poll_id) DO NOTHING;

UPDATE poll_stats ps
SET total_votes = ps.votes_a + ps.votes_b
FROM polls p
WHERE ps.poll_id = p.id;
