-- Split v3 — Auto-schedule draft polls for upcoming days
-- Run after 002_v3_schema.sql
--
-- Assigns every unscheduled draft poll to a consecutive future day
-- starting tomorrow. Safe to re-run: only touches drafts with no date.

WITH draft_polls AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM polls
  WHERE status = 'draft'
    AND date IS NULL
    AND scheduled_for IS NULL
),
available_days AS (
  SELECT
    d::date AS target_date,
    ROW_NUMBER() OVER (ORDER BY d) AS rn
  FROM generate_series(
    CURRENT_DATE + 1,
    CURRENT_DATE + 365,
    '1 day'::interval
  ) AS d
  WHERE d::date NOT IN (
    SELECT date FROM polls WHERE date IS NOT NULL
  )
),
assignments AS (
  SELECT dp.id AS poll_id, ad.target_date
  FROM draft_polls dp
  JOIN available_days ad ON ad.rn = dp.rn
)
UPDATE polls p
SET
  status        = 'scheduled',
  scheduled_for = a.target_date,
  date          = a.target_date
FROM assignments a
WHERE p.id = a.poll_id;

-- Ensure every scheduled poll has a poll_stats row
INSERT INTO poll_stats (poll_id, votes_a, votes_b, total_votes)
SELECT p.id, 0, 0, 0
FROM polls p
WHERE p.status IN ('scheduled', 'draft')
  AND NOT EXISTS (
    SELECT 1 FROM poll_stats ps WHERE ps.poll_id = p.id
  )
ON CONFLICT (poll_id) DO NOTHING;
