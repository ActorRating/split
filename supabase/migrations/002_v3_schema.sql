-- Split v3 — Content System + Admin Dashboard
-- Run in Supabase SQL Editor after 001_schema.sql

-- ─────────────────────────────────────────────────────────────
-- 1. Upgrade polls table
-- ─────────────────────────────────────────────────────────────

-- Make date nullable so draft polls don't need a date yet
ALTER TABLE polls ALTER COLUMN date DROP NOT NULL;

-- Add content-system columns
ALTER TABLE polls
  ADD COLUMN IF NOT EXISTS status      text        NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS scheduled_for date,
  ADD COLUMN IF NOT EXISTS tags        text[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS difficulty  int         NOT NULL DEFAULT 3;

ALTER TABLE polls DROP CONSTRAINT IF EXISTS polls_status_check;
ALTER TABLE polls ADD CONSTRAINT polls_status_check
  CHECK (status IN ('draft', 'scheduled', 'published'));

-- Backfill: existing dated polls are published; undated are drafts
UPDATE polls SET status = 'published' WHERE date IS NOT NULL AND status = 'published';
UPDATE polls SET status = 'draft'     WHERE date IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. Admin users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text        NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Users can read their own admin row (needed for self-check in API routes)
DROP POLICY IF EXISTS "admin_users_self_read" ON admin_users;
CREATE POLICY "admin_users_self_read" ON admin_users
  FOR SELECT USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 3. Poll suggestions pipeline (richer than old suggestions table)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poll_suggestions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  question     text        NOT NULL,
  option_a     text,
  option_b     text,
  submitted_by uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  status       text        NOT NULL DEFAULT 'pending',
  admin_notes  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT poll_suggestions_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

ALTER TABLE poll_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "poll_suggestions_user_insert" ON poll_suggestions;
CREATE POLICY "poll_suggestions_user_insert" ON poll_suggestions
  FOR INSERT WITH CHECK (auth.uid() = submitted_by OR submitted_by IS NULL);

DROP POLICY IF EXISTS "poll_suggestions_user_read_own" ON poll_suggestions;
CREATE POLICY "poll_suggestions_user_read_own" ON poll_suggestions
  FOR SELECT USING (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "poll_suggestions_admin_all" ON poll_suggestions;
CREATE POLICY "poll_suggestions_admin_all" ON poll_suggestions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- 4. Update polls RLS — drafts visible only to admins
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "polls_public_read" ON polls;

CREATE POLICY "polls_public_read" ON polls
  FOR SELECT USING (
    status IN ('published', 'scheduled')
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "polls_admin_write" ON polls;
CREATE POLICY "polls_admin_write" ON polls
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- 5. Seed 300 quality polls (all status='draft', ready to schedule)
-- ─────────────────────────────────────────────────────────────
INSERT INTO polls (question, option_a, option_b, emoji_a, emoji_b, status, tags, difficulty) VALUES
-- ── FOOD (40) ────────────────────────────────────────────────
('Pizza or tacos?', 'Pizza', 'Tacos', '🍕', '🌮', 'draft', ARRAY['food'], 1),
('Coffee or tea?', 'Coffee', 'Tea', '☕', '🍵', 'draft', ARRAY['food'], 1),
('Chocolate or vanilla?', 'Chocolate', 'Vanilla', '🍫', '🍦', 'draft', ARRAY['food'], 1),
('Sweet breakfast or savory breakfast?', 'Sweet', 'Savory', '🥞', '🍳', 'draft', ARRAY['food'], 2),
('Burgers or hot dogs?', 'Burgers', 'Hot dogs', '🍔', '🌭', 'draft', ARRAY['food'], 1),
('Pasta or rice?', 'Pasta', 'Rice', '🍝', '🍚', 'draft', ARRAY['food'], 1),
('Sushi or ramen?', 'Sushi', 'Ramen', '🍣', '🍜', 'draft', ARRAY['food'], 2),
('Pineapple on pizza?', 'Yes, pineapple', 'Absolutely not', '🍍', '🚫', 'draft', ARRAY['food'], 1),
('Beer or wine?', 'Beer', 'Wine', '🍺', '🍷', 'draft', ARRAY['food'], 2),
('Ketchup or mustard?', 'Ketchup', 'Mustard', '🍅', '🟡', 'draft', ARRAY['food'], 1),
('Cake or pie?', 'Cake', 'Pie', '🎂', '🥧', 'draft', ARRAY['food'], 1),
('Chips or popcorn?', 'Chips', 'Popcorn', '🥔', '🍿', 'draft', ARRAY['food'], 1),
('Home-cooked or restaurant?', 'Home-cooked', 'Restaurant', '🏠', '🍽️', 'draft', ARRAY['food'], 2),
('Ice cream or frozen yogurt?', 'Ice cream', 'Frozen yogurt', '🍨', '🍦', 'draft', ARRAY['food'], 1),
('Fries or onion rings?', 'Fries', 'Onion rings', '🍟', '🧅', 'draft', ARRAY['food'], 1),
('Hot coffee or iced coffee?', 'Hot coffee', 'Iced coffee', '☕', '🧊', 'draft', ARRAY['food'], 1),
('Steak: well done or rare?', 'Well done', 'Rare', '🥩', '🩸', 'draft', ARRAY['food'], 3),
('Salty snacks or sweet snacks?', 'Salty', 'Sweet', '🧂', '🍬', 'draft', ARRAY['food'], 1),
('Milk chocolate or dark chocolate?', 'Milk chocolate', 'Dark chocolate', '🍫', '⬛', 'draft', ARRAY['food'], 2),
('Tacos or burritos?', 'Tacos', 'Burritos', '🌮', '🌯', 'draft', ARRAY['food'], 1),
('Croissant or bagel?', 'Croissant', 'Bagel', '🥐', '🥯', 'draft', ARRAY['food'], 2),
('Avocado: love it or hate it?', 'Love avocado', 'Hate it', '🥑', '🚫', 'draft', ARRAY['food'], 2),
('Indian food or Mexican food?', 'Indian', 'Mexican', '🍛', '🌮', 'draft', ARRAY['food'], 2),
('Salad as a meal: yes or no?', 'Yes, a real meal', 'Never as a meal', '🥗', '🙅', 'draft', ARRAY['food'], 2),
('Street food or fine dining?', 'Street food', 'Fine dining', '🌮', '🍷', 'draft', ARRAY['food'], 3),
('Pancakes or waffles?', 'Pancakes', 'Waffles', '🥞', '🧇', 'draft', ARRAY['food'], 2),
('Breakfast food all day or never before noon?', 'Breakfast all day', 'Only at breakfast time', '🍳', '🕐', 'draft', ARRAY['food'], 3),
('Thin crust or thick crust pizza?', 'Thin crust', 'Thick crust', '🫓', '🍕', 'draft', ARRAY['food'], 2),
('Cook at home every day or eat out every day?', 'Cook at home', 'Eat out every day', '👨‍🍳', '🍽️', 'draft', ARRAY['food'], 3),
('Leftovers the next day: great or gross?', 'Great', 'Gross', '🥡', '✨', 'draft', ARRAY['food'], 2),
('Smoothie or juice?', 'Smoothie', 'Juice', '🥤', '🍊', 'draft', ARRAY['food'], 1),
('Cheese on everything or almost no cheese?', 'Cheese on everything', 'Minimal cheese', '🧀', '🚫', 'draft', ARRAY['food'], 2),
('Soup: chunky or smooth?', 'Chunky', 'Smooth', '🥣', '🍲', 'draft', ARRAY['food'], 1),
('Garlic bread or no garlic bread with pasta?', 'Always garlic bread', 'Just the pasta', '🧄', '🍝', 'draft', ARRAY['food'], 1),
('Spicy food lover or can''t handle spice?', 'Bring the heat', 'No spice please', '🌶️', '🌿', 'draft', ARRAY['food'], 2),
('Breakfast: eggs or cereal?', 'Eggs', 'Cereal', '🍳', '🥣', 'draft', ARRAY['food'], 1),
('Salmon or tuna?', 'Salmon', 'Tuna', '🐟', '🐠', 'draft', ARRAY['food'], 2),
('Butter or olive oil?', 'Butter', 'Olive oil', '🧈', '🫒', 'draft', ARRAY['food'], 2),
('Pizza delivery or frozen pizza at home?', 'Delivery', 'Frozen pizza', '🚴', '🥶', 'draft', ARRAY['food'], 2),
('Food truck or sit-down restaurant?', 'Food truck', 'Sit-down', '🚚', '🍽️', 'draft', ARRAY['food'], 2),

-- ── PHILOSOPHY (35) ───────────────────────────────────────────
('Free will or determinism?', 'Free will exists', 'Everything is determined', '🧠', '⚙️', 'draft', ARRAY['philosophy'], 5),
('Nature or nurture shapes you more?', 'Nature', 'Nurture', '🧬', '🌱', 'draft', ARRAY['philosophy'], 4),
('Truth or happiness if forced to choose?', 'Truth above all', 'Happiness above all', '💡', '😊', 'draft', ARRAY['philosophy'], 4),
('Is morality objective or subjective?', 'Objective', 'Subjective', '⚖️', '🌊', 'draft', ARRAY['philosophy'], 5),
('Mind or body: which is more ''you''?', 'Mind', 'Body', '🧠', '💪', 'draft', ARRAY['philosophy'], 5),
('The glass is half full or half empty?', 'Half full', 'Half empty', '☀️', '🌧️', 'draft', ARRAY['philosophy'], 1),
('Are we living in a simulation?', 'Yes, probably', 'No, it''s real', '💻', '🌌', 'draft', ARRAY['philosophy'], 5),
('Fate or chance — what drives your life?', 'Fate', 'Chance', '🎯', '🎲', 'draft', ARRAY['philosophy'], 4),
('Is there life after death?', 'Yes', 'No', '👼', '💀', 'draft', ARRAY['philosophy'], 4),
('Better to be kind or honest when they conflict?', 'Kind', 'Honest', '💛', '🗣️', 'draft', ARRAY['philosophy'], 4),
('What matters more in ethics: rules or results?', 'Rules matter most', 'Results matter most', '📋', '🏆', 'draft', ARRAY['philosophy'], 5),
('Should animals have the same rights as humans?', 'Yes', 'No', '🐾', '👤', 'draft', ARRAY['philosophy'], 4),
('Better to know a painful truth or a comforting lie?', 'Painful truth', 'Comforting lie', '💡', '🌸', 'draft', ARRAY['philosophy'], 3),
('Do you owe your parents anything for raising you?', 'Yes', 'No', '👨‍👩‍👧', '🆓', 'draft', ARRAY['philosophy'], 4),
('Is revenge ever truly justified?', 'Yes', 'No', '⚡', '☮️', 'draft', ARRAY['philosophy'], 4),
('Human nature: good or evil by default?', 'Good', 'Evil', '😇', '😈', 'draft', ARRAY['philosophy'], 4),
('Better: die young and fulfilled or old and bored?', 'Young and fulfilled', 'Old and bored', '✨', '📅', 'draft', ARRAY['philosophy'], 4),
('Intelligence or wisdom: which is more valuable?', 'Intelligence', 'Wisdom', '🧠', '🦉', 'draft', ARRAY['philosophy'], 3),
('Is it possible to be truly selfless?', 'Yes', 'No', '💝', '🤔', 'draft', ARRAY['philosophy'], 4),
('Do you believe in karma?', 'Yes', 'No', '♻️', '🎲', 'draft', ARRAY['philosophy'], 3),
('Does art need meaning to be art?', 'Yes', 'No', '🎭', '🖌️', 'draft', ARRAY['philosophy'], 3),
('Would you sacrifice one person to save five?', 'Yes', 'No', '⚖️', '🛑', 'draft', ARRAY['philosophy'], 5),
('Is happiness the ultimate goal of life?', 'Yes', 'No', '😊', '🎯', 'draft', ARRAY['philosophy'], 4),
('Is it wrong to eat meat?', 'Yes', 'No', '🌿', '🥩', 'draft', ARRAY['philosophy'], 4),
('Should all information be free?', 'Yes', 'No', '🌐', '🔒', 'draft', ARRAY['philosophy'], 4),
('Can machines ever be truly conscious?', 'Yes', 'No', '🤖', '🧠', 'draft', ARRAY['philosophy'], 5),
('Is war ever justified?', 'Yes', 'No', '⚔️', '☮️', 'draft', ARRAY['philosophy'], 4),
('Better to be feared or respected?', 'Feared', 'Respected', '😱', '🙏', 'draft', ARRAY['philosophy'], 4),
('Is jealousy a sign of love or insecurity?', 'Love', 'Insecurity', '❤️', '😰', 'draft', ARRAY['philosophy'], 3),
('Does forgiveness require an apology?', 'Yes', 'No', '🙏', '🆓', 'draft', ARRAY['philosophy'], 3),
('Would you want to know the exact date of your death?', 'Yes', 'No', '📅', '🙈', 'draft', ARRAY['philosophy'], 5),
('Is silence a form of communication?', 'Yes', 'No', '🤫', '💬', 'draft', ARRAY['philosophy'], 3),
('Do you have a right to absolute privacy from government?', 'Yes', 'No', '🛡️', '👁️', 'draft', ARRAY['philosophy'], 4),
('Is change always good?', 'Yes', 'No', '🔄', '⚓', 'draft', ARRAY['philosophy'], 3),
('Is the self an illusion?', 'Yes', 'No', '🪞', '🧠', 'draft', ARRAY['philosophy'], 5),

-- ── FUNNY (40) ────────────────────────────────────────────────
('Fight 100 duck-sized horses or 1 horse-sized duck?', '100 duck-sized horses', '1 horse-sized duck', '🐴', '🦆', 'draft', ARRAY['funny'], 3),
('Only whisper forever or only shout forever?', 'Whisper only', 'Shout only', '🤫', '📢', 'draft', ARRAY['funny'], 2),
('Walk on your hands for a day or cluck like a chicken?', 'Walk on hands', 'Cluck like a chicken', '🤸', '🐔', 'draft', ARRAY['funny'], 2),
('Never sit again or never stand again?', 'Never sit', 'Never stand', '🧍', '🪑', 'draft', ARRAY['funny'], 2),
('Wake up as a dog or a cat?', 'Dog', 'Cat', '🐶', '🐱', 'draft', ARRAY['funny'], 1),
('Hiccups for life or always feel like you''re about to sneeze?', 'Hiccups forever', 'Always pre-sneeze', '😤', '🤧', 'draft', ARRAY['funny'], 2),
('Sneeze glitter or cough confetti?', 'Sneeze glitter', 'Cough confetti', '✨', '🎉', 'draft', ARRAY['funny'], 1),
('Arms as long as your legs or legs as long as your arms?', 'Super long arms', 'Super long legs', '💪', '🦵', 'draft', ARRAY['funny'], 2),
('Never use a microwave again or never use the internet again?', 'No microwave', 'No internet', '📡', '🌐', 'draft', ARRAY['funny'], 3),
('Pet elephant or pet lion?', 'Elephant', 'Lion', '🐘', '🦁', 'draft', ARRAY['funny'], 2),
('Invisible but smell terrible or visible but completely odorless?', 'Invisible + smelly', 'Visible + odorless', '👻', '🌸', 'draft', ARRAY['funny'], 2),
('Only eat yellow foods or only eat green foods?', 'Yellow foods only', 'Green foods only', '🟡', '🟢', 'draft', ARRAY['funny'], 2),
('Lose search engines or lose social media?', 'No search engines', 'No social media', '🔍', '📱', 'draft', ARRAY['funny'], 3),
('Your laugh is a goose honk or a seal bark?', 'Goose honk', 'Seal bark', '🦢', '🦭', 'draft', ARRAY['funny'], 1),
('Sleep 20 hours a day or only 2 hours a day?', '20 hours sleep', '2 hours sleep', '😴', '⚡', 'draft', ARRAY['funny'], 3),
('Speak only in song lyrics or only in movie quotes?', 'Song lyrics', 'Movie quotes', '🎵', '🎬', 'draft', ARRAY['funny'], 2),
('Your hair grows 1 inch per year or 1 inch per hour?', '1 inch per year', '1 inch per hour', '🐌', '⚡', 'draft', ARRAY['funny'], 2),
('Involuntary dance every time you hear music or involuntary sing?', 'Involuntary dancing', 'Involuntary singing', '💃', '🎤', 'draft', ARRAY['funny'], 2),
('Laugh track follows you everywhere or crickets when you joke?', 'Laugh track', 'Crickets', '😂', '🦗', 'draft', ARRAY['funny'], 2),
('Communicate only via emoji or only via GIF?', 'Emoji only', 'GIF only', '😀', '🎞️', 'draft', ARRAY['funny'], 1),
('Always arrive 30 minutes early or always 30 minutes late?', '30 min early', '30 min late', '⏰', '🐌', 'draft', ARRAY['funny'], 2),
('Step on a LEGO every morning or stub your toe every evening?', 'LEGO every morning', 'Toe stub every evening', '🧱', '😣', 'draft', ARRAY['funny'], 1),
('Shoes too small or hat too big forever?', 'Tiny shoes forever', 'Giant hat forever', '👟', '🎩', 'draft', ARRAY['funny'], 1),
('Forget names immediately or know names but nothing else?', 'Forget every name', 'Names only, nothing else', '🧠', '📛', 'draft', ARRAY['funny'], 2),
('Battery dies at worst moment or charger breaks at worst moment?', 'Battery dies', 'Charger breaks', '🔋', '🔌', 'draft', ARRAY['funny'], 1),
('Only eat at the same restaurant forever or never repeat one?', 'Same restaurant forever', 'Never repeat a restaurant', '🍽️', '🔄', 'draft', ARRAY['funny'], 3),
('Have a photo of every embarrassing moment or none at all?', 'Every moment documented', 'No evidence ever', '📸', '🔥', 'draft', ARRAY['funny'], 2),
('Everyone can see your WiFi password as a halo or can hear your thoughts?', 'WiFi password visible', 'Thoughts audible', '📶', '💭', 'draft', ARRAY['funny'], 3),
('Stairs play a musical note with each step or don''t?', 'Musical stairs', 'Silent stairs', '🪜', '🎵', 'draft', ARRAY['funny'], 1),
('Everyone you meet gets a theme song or you narrate your own life?', 'Theme songs for all', 'Narrate your own life', '🎵', '🎙️', 'draft', ARRAY['funny'], 2),
('Can speak to fish but they only discuss taxes or can''t speak to fish?', 'Tax-obsessed fish conversations', 'No fish talk', '🐟', '📋', 'draft', ARRAY['funny'], 2),
('Your shadow has opinions or your reflection does?', 'Opinionated shadow', 'Opinionated reflection', '👥', '🪞', 'draft', ARRAY['funny'], 2),
('All historical events narrated by Morgan Freeman or David Attenborough?', 'Morgan Freeman', 'David Attenborough', '🎙️', '🌿', 'draft', ARRAY['funny'], 1),
('Timer shows how long someone wants to keep talking or their age?', 'Time remaining', 'Their real age', '⏱️', '🔢', 'draft', ARRAY['funny'], 2),
('The sky turns plaid or polka-dotted?', 'Plaid sky', 'Polka-dot sky', '🌈', '⚫', 'draft', ARRAY['funny'], 1),
('All doors need a personality quiz to open or require a riddle?', 'Personality quiz', 'A riddle', '🚪', '📋', 'draft', ARRAY['funny'], 2),
('Gravity optional on Sundays or on Mondays?', 'Optional gravity Sundays', 'Optional gravity Mondays', '🌍', '✨', 'draft', ARRAY['funny'], 2),
('All traffic lights now decided by rock-paper-scissors?', 'Great idea', 'Absolute chaos', '🟢', '✊', 'draft', ARRAY['funny'], 1),
('You earn money for vivid dreams or lose money for nightmares?', 'Earn for good dreams', 'Lose for bad dreams', '💤', '💰', 'draft', ARRAY['funny'], 3),
('You can time-travel but only 10 seconds back or 10 years forward?', '10 seconds back', '10 years forward', '⏪', '⏩', 'draft', ARRAY['funny'], 3),

-- ── RELATIONSHIPS (38) ────────────────────────────────────────
('True love or financial security?', 'True love', 'Financial security', '❤️', '💰', 'draft', ARRAY['relationships'], 4),
('Long-distance relationship or no relationship?', 'Long-distance', 'No relationship', '✈️', '🏠', 'draft', ARRAY['relationships'], 4),
('Soulmate who annoys you or peaceful life alone?', 'Annoying soulmate', 'Peaceful solo life', '❤️', '☮️', 'draft', ARRAY['relationships'], 4),
('Date someone your family hates or be single forever?', 'Date who you love', 'Stay single forever', '❤️', '🚫', 'draft', ARRAY['relationships'], 4),
('Marry your best friend or the most attractive person you know?', 'Marry best friend', 'Marry most attractive', '🤝', '😍', 'draft', ARRAY['relationships'], 4),
('Text or call?', 'Text', 'Call', '💬', '📞', 'draft', ARRAY['relationships'], 1),
('Forgive a cheater or end it immediately?', 'Forgive and stay', 'End it immediately', '❤️‍🩹', '🚪', 'draft', ARRAY['relationships'], 4),
('Be the one who loves more or be loved more?', 'Love more', 'Be loved more', '💘', '💝', 'draft', ARRAY['relationships'], 4),
('Tell a friend their partner is cheating or stay silent?', 'Tell them', 'Stay out of it', '🗣️', '🤐', 'draft', ARRAY['relationships'], 5),
('Grand romantic gestures or small consistent acts of love?', 'Grand gestures', 'Small consistent acts', '🌹', '☕', 'draft', ARRAY['relationships'], 3),
('Date someone older or someone younger?', 'Older', 'Younger', '👴', '🧒', 'draft', ARRAY['relationships'], 2),
('Partner messier than you or cleaner than you?', 'Messier partner', 'Cleaner partner', '😅', '🧹', 'draft', ARRAY['relationships'], 2),
('Live together before marriage or wait?', 'Live together first', 'Wait until married', '🏠', '💍', 'draft', ARRAY['relationships'], 3),
('Radical honesty with your partner or white lies to protect feelings?', 'Radical honesty', 'White lies sometimes', '💡', '🌸', 'draft', ARRAY['relationships'], 4),
('Be completely open about finances or keep money private?', 'Share everything', 'Financial privacy', '💰', '🔒', 'draft', ARRAY['relationships'], 3),
('Partner who loves your flaws or tries to fix them?', 'Love the flaws', 'Fix the flaws', '💛', '🔧', 'draft', ARRAY['relationships'], 3),
('Couple that agrees on everything or loves to debate?', 'Total agreement', 'Passionate debates', '☮️', '⚡', 'draft', ARRAY['relationships'], 3),
('Know your partner''s phone password or not?', 'Know it', 'Don''t know it', '🔓', '🔐', 'draft', ARRAY['relationships'], 3),
('Move cities for love or make love come to you?', 'Move for love', 'Make them move', '✈️', '🏠', 'draft', ARRAY['relationships'], 4),
('Best friends with your ex or total strangers?', 'Best friends', 'Total strangers', '🤝', '👻', 'draft', ARRAY['relationships'], 4),
('Relationship with zero conflict or with healthy arguments?', 'Zero conflict', 'Healthy arguments', '☮️', '🔥', 'draft', ARRAY['relationships'], 3),
('Partner who is your total opposite or your mirror?', 'Total opposite', 'Carbon copy', '🌗', '🪞', 'draft', ARRAY['relationships'], 3),
('Give up social media for a relationship or keep it?', 'Give up social media', 'Keep social media', '📵', '📱', 'draft', ARRAY['relationships'], 4),
('End a friendship to save a relationship or save the friendship?', 'Save the relationship', 'Save the friendship', '❤️', '🤝', 'draft', ARRAY['relationships'], 4),
('Unrequited love or in a relationship without love?', 'Unrequited love', 'Loveless relationship', '💔', '😶', 'draft', ARRAY['relationships'], 5),
('Propose or be proposed to?', 'Propose', 'Be proposed to', '💍', '💐', 'draft', ARRAY['relationships'], 2),
('Hot summer romance that ends or slow burn that lasts forever?', 'Summer romance', 'Slow burn forever', '🌞', '🔥', 'draft', ARRAY['relationships'], 3),
('Partner always late or always early?', 'Always late', 'Always early', '🐌', '⏰', 'draft', ARRAY['relationships'], 2),
('Fewer deep friendships or many casual ones?', 'Few deep friends', 'Many casual ones', '💎', '🌊', 'draft', ARRAY['relationships'], 3),
('Know everything about your partner''s past or start fresh?', 'Know their full past', 'Start fresh', '👁️', '🌅', 'draft', ARRAY['relationships'], 4),
('Relationship that ends well or mediocre one that never ends?', 'Good ending', 'Mediocre but lasting', '✨', '😐', 'draft', ARRAY['relationships'], 4),
('Be brutally honest about your partner''s faults or stay quiet?', 'Brutally honest', 'Stay quiet', '🗣️', '🤫', 'draft', ARRAY['relationships'], 4),
('Stay with someone who has completely changed or leave?', 'Stay', 'Leave', '❤️', '🚪', 'draft', ARRAY['relationships'], 4),
('Jealousy in a relationship: sometimes OK or always a red flag?', 'Sometimes OK', 'Always a red flag', '😤', '🚩', 'draft', ARRAY['relationships'], 3),
('Public displays of affection: love it or cringe?', 'Love PDA', 'Cringe at PDA', '😘', '🙈', 'draft', ARRAY['relationships'], 2),
('Share a bed forever or sleep in separate rooms?', 'Share a bed', 'Separate rooms', '🛏️', '🚪', 'draft', ARRAY['relationships'], 3),
('Partner who is funny but messy or serious but tidy?', 'Funny and messy', 'Serious and tidy', '😂', '✨', 'draft', ARRAY['relationships'], 3),
('Plan every date or always spontaneous?', 'Plan every date', 'Always spontaneous', '📋', '🎲', 'draft', ARRAY['relationships'], 2),

-- ── TECH (35) ─────────────────────────────────────────────────
('iPhone or Android?', 'iPhone', 'Android', '🍎', '🤖', 'draft', ARRAY['tech'], 2),
('Mac or Windows?', 'Mac', 'Windows', '🍏', '🪟', 'draft', ARRAY['tech'], 3),
('Privacy or convenience?', 'Privacy first', 'Convenience first', '🛡️', '⚡', 'draft', ARRAY['tech'], 4),
('Social media: net positive or net negative for society?', 'Net positive', 'Net negative', '📱', '📉', 'draft', ARRAY['tech'], 4),
('Would you get a brain chip like Neuralink?', 'Yes', 'No', '🧠', '🚫', 'draft', ARRAY['tech'], 5),
('Work remotely forever or in-office forever?', 'Remote forever', 'Office forever', '🏠', '🏢', 'draft', ARRAY['tech'], 3),
('Delete all social media or keep it all?', 'Delete it all', 'Keep it all', '🗑️', '📱', 'draft', ARRAY['tech'], 3),
('AI: more good than harm or more harm than good for humanity?', 'More good', 'More harm', '🤖', '⚠️', 'draft', ARRAY['tech'], 5),
('Light mode or dark mode?', 'Light mode', 'Dark mode', '☀️', '🌑', 'draft', ARRAY['tech'], 1),
('Self-driving cars: trust them or not yet?', 'Trust them', 'Not ready', '🚗', '🛑', 'draft', ARRAY['tech'], 4),
('Streaming or cable TV?', 'Streaming', 'Cable', '📺', '📡', 'draft', ARRAY['tech'], 1),
('Gaming PC or console?', 'Gaming PC', 'Console', '🖥️', '🎮', 'draft', ARRAY['tech'], 2),
('VR will be mainstream by 2030 or still niche?', 'Mainstream', 'Still niche', '🥽', '🎯', 'draft', ARRAY['tech'], 4),
('Email or messaging apps for work?', 'Email', 'Messaging apps', '📧', '💬', 'draft', ARRAY['tech'], 2),
('Cable charging or wireless charging?', 'Cable', 'Wireless', '🔌', '📡', 'draft', ARRAY['tech'], 1),
('Smart home or traditional home?', 'Smart home', 'Traditional', '🏠', '🕰️', 'draft', ARRAY['tech'], 3),
('E-reader or physical books?', 'E-reader', 'Physical books', '📱', '📚', 'draft', ARRAY['tech'], 2),
('Spotify or Apple Music?', 'Spotify', 'Apple Music', '🎵', '🍎', 'draft', ARRAY['tech'], 1),
('TikTok: ban it or free speech?', 'Ban it', 'Free speech', '🚫', '🗣️', 'draft', ARRAY['tech'], 4),
('Would you trust an AI doctor''s diagnosis?', 'Yes', 'No', '🤖', '👨‍⚕️', 'draft', ARRAY['tech'], 4),
('Upgrade phone every year or keep it 3+ years?', 'Every year', '3+ years', '🆕', '♻️', 'draft', ARRAY['tech'], 2),
('Quantum computing: revolutionary or overhyped?', 'Revolutionary', 'Overhyped', '⚛️', '📊', 'draft', ARRAY['tech'], 5),
('Would you upload your consciousness to a computer?', 'Yes', 'No', '🧠', '💻', 'draft', ARRAY['tech'], 5),
('Open source or proprietary software?', 'Open source', 'Proprietary', '🔓', '🔒', 'draft', ARRAY['tech'], 3),
('Password manager or memorize your passwords?', 'Password manager', 'Memorize', '🔐', '🧠', 'draft', ARRAY['tech'], 2),
('ChatGPT replaces Google search or they coexist?', 'Replaces Google', 'Coexist', '🤖', '🔍', 'draft', ARRAY['tech'], 4),
('Tabs or spaces in code?', 'Tabs', 'Spaces', '↹', '␣', 'draft', ARRAY['tech'], 3),
('GitHub Copilot: helpful or cheating?', 'Helpful', 'Cheating', '🤝', '🚫', 'draft', ARRAY['tech'], 3),
('Physical keyboard or touchscreen for productivity?', 'Physical keyboard', 'Touchscreen', '⌨️', '📱', 'draft', ARRAY['tech'], 2),
('Would you live entirely off-grid for a year?', 'Yes', 'No', '🌿', '🏙️', 'draft', ARRAY['tech'], 4),
('Buy crypto now or keep cash?', 'Buy crypto', 'Keep cash', '🪙', '💵', 'draft', ARRAY['tech'], 4),
('One big monitor or multiple smaller ones?', 'One big screen', 'Multiple screens', '🖥️', '🖥️🖥️', 'draft', ARRAY['tech'], 2),
('News on social media or dedicated news sites?', 'Social media', 'Dedicated news sites', '📲', '📰', 'draft', ARRAY['tech'], 3),
('Tech companies: too powerful or just right?', 'Too powerful', 'Just right', '🏢', '⚖️', 'draft', ARRAY['tech'], 4),
('Elon Musk: visionary genius or dangerous chaos agent?', 'Visionary genius', 'Dangerous chaos', '🚀', '💥', 'draft', ARRAY['tech'], 4),

-- ── LIFESTYLE (40) ────────────────────────────────────────────
('Morning person or night owl?', 'Morning person', 'Night owl', '🌅', '🦉', 'draft', ARRAY['lifestyle'], 1),
('City life or countryside?', 'City', 'Countryside', '🏙️', '🌿', 'draft', ARRAY['lifestyle'], 2),
('Planner or spontaneous?', 'Planner', 'Spontaneous', '📋', '🎲', 'draft', ARRAY['lifestyle'], 2),
('Introvert or extrovert?', 'Introvert', 'Extrovert', '🏠', '🎉', 'draft', ARRAY['lifestyle'], 1),
('Money or passion in your career?', 'Money', 'Passion', '💰', '❤️', 'draft', ARRAY['lifestyle'], 4),
('Work to live or live to work?', 'Work to live', 'Live to work', '🏖️', '💼', 'draft', ARRAY['lifestyle'], 3),
('Gym or outdoor fitness?', 'Gym', 'Outdoors', '🏋️', '🏃', 'draft', ARRAY['lifestyle'], 2),
('Save money or spend on experiences?', 'Save money', 'Spend on experiences', '💰', '✈️', 'draft', ARRAY['lifestyle'], 3),
('Own a home or always rent?', 'Own a home', 'Always rent', '🏠', '🔑', 'draft', ARRAY['lifestyle'], 4),
('Travel alone or with someone?', 'Travel alone', 'Always with company', '🧳', '👫', 'draft', ARRAY['lifestyle'], 3),
('Big wedding or small ceremony?', 'Big wedding', 'Small and intimate', '💒', '🌿', 'draft', ARRAY['lifestyle'], 2),
('Strict daily routine or wing it every day?', 'Strict routine', 'Wing it', '⏰', '🎲', 'draft', ARRAY['lifestyle'], 2),
('Physical book or audiobook?', 'Physical book', 'Audiobook', '📚', '🎧', 'draft', ARRAY['lifestyle'], 2),
('Road trip or flight?', 'Road trip', 'Fly there', '🚗', '✈️', 'draft', ARRAY['lifestyle'], 2),
('Dogs or cats?', 'Dogs', 'Cats', '🐶', '🐱', 'draft', ARRAY['lifestyle'], 1),
('Career change every 5 years or one career for life?', 'Career hopper', 'One career forever', '🔄', '⚓', 'draft', ARRAY['lifestyle'], 4),
('Minimalism or maximalism at home?', 'Minimalism', 'Maximalism', '◻️', '🎨', 'draft', ARRAY['lifestyle'], 3),
('Summer or winter?', 'Summer', 'Winter', '☀️', '❄️', 'draft', ARRAY['lifestyle'], 1),
('Early retirement or work until 70?', 'Early retirement', 'Work until 70', '🏖️', '💼', 'draft', ARRAY['lifestyle'], 4),
('Same healthy meal daily or variety but less healthy?', 'Same healthy meal', 'Varied but less healthy', '🥗', '🍔', 'draft', ARRAY['lifestyle'], 3),
('Have 3 kids or no kids?', '3 kids', 'No kids', '👨‍👩‍👧‍👦', '🙅', 'draft', ARRAY['lifestyle'], 4),
('Fame for 15 minutes or comfortable obscurity forever?', '15 min of fame', 'Comfortable obscurity', '⭐', '🌿', 'draft', ARRAY['lifestyle'], 3),
('Pursue your dream career or do the safe thing?', 'Chase the dream', 'Do the safe thing', '🌟', '🛡️', 'draft', ARRAY['lifestyle'], 4),
('Cold shower or hot shower?', 'Cold shower', 'Hot shower', '🧊', '🔥', 'draft', ARRAY['lifestyle'], 1),
('Read before bed or phone before bed?', 'Read a book', 'Scroll the phone', '📚', '📱', 'draft', ARRAY['lifestyle'], 2),
('Meal prep Sunday or cook fresh every day?', 'Meal prep Sunday', 'Cook daily', '🍱', '🍳', 'draft', ARRAY['lifestyle'], 2),
('Rent a luxury place or own a modest one?', 'Luxury rental', 'Own something modest', '✨', '🏠', 'draft', ARRAY['lifestyle'], 4),
('10,000 steps daily or 7+ hours of sleep?', '10,000 steps', 'Full sleep', '🚶', '😴', 'draft', ARRAY['lifestyle'], 3),
('Unplug on weekends or stay connected always?', 'Weekend unplug', 'Always connected', '🔌', '📱', 'draft', ARRAY['lifestyle'], 3),
('Side hustle or full-time focus?', 'Side hustle', 'Full-time focus', '💼', '🎯', 'draft', ARRAY['lifestyle'], 3),
('Live abroad for a year or stay home?', 'Live abroad', 'Stay home', '✈️', '🏠', 'draft', ARRAY['lifestyle'], 3),
('Master one skill or be decent at many?', 'Master one', 'Good at many', '🎯', '🌊', 'draft', ARRAY['lifestyle'], 3),
('Therapy: always valuable or not necessary for everyone?', 'Always valuable', 'Not for everyone', '🛋️', '💪', 'draft', ARRAY['lifestyle'], 3),
('Journal daily or never journal?', 'Journal daily', 'Never journal', '📔', '🙅', 'draft', ARRAY['lifestyle'], 2),
('Social media detox every month or never?', 'Monthly detox', 'Never detox', '🧹', '📱', 'draft', ARRAY['lifestyle'], 2),
('Wake up at 5am or 9am?', '5am riser', '9am riser', '🌅', '😴', 'draft', ARRAY['lifestyle'], 2),
('Suburbs or urban core?', 'Suburbs', 'Urban core', '🏘️', '🏙️', 'draft', ARRAY['lifestyle'], 2),
('Declutter every season or accumulate forever?', 'Declutter often', 'Accumulate forever', '🧹', '📦', 'draft', ARRAY['lifestyle'], 2),
('Go to bed early or stay up late?', 'Early to bed', 'Stay up late', '🌙', '⭐', 'draft', ARRAY['lifestyle'], 1),
('Dress for comfort or dress to impress?', 'Dress for comfort', 'Dress to impress', '👕', '👔', 'draft', ARRAY['lifestyle'], 2),

-- ── ABSURD (40) ───────────────────────────────────────────────
('Sentient furniture or talking appliances?', 'Sentient furniture', 'Talking appliances', '🛋️', '🍳', 'draft', ARRAY['absurd'], 1),
('Cows can vote in elections?', 'Great idea', 'Terrible idea', '🐄', '🗳️', 'draft', ARRAY['absurd'], 1),
('All food is now cube-shaped?', 'I can adapt', 'Unacceptable', '🟫', '🚫', 'draft', ARRAY['absurd'], 1),
('All music must be played backwards?', 'I''d adapt', 'No way', '⏪', '🎵', 'draft', ARRAY['absurd'], 2),
('Cats run governments, dogs run corporations?', 'Perfect world', 'Complete disaster', '🐱', '🐶', 'draft', ARRAY['absurd'], 1),
('The moon has a personality and it''s passive-aggressive?', 'Relatable', 'Terrifying', '🌙', '😒', 'draft', ARRAY['absurd'], 1),
('Trees have to file taxes?', 'Fascinating', 'Pointless', '🌳', '📋', 'draft', ARRAY['absurd'], 1),
('You can only communicate in interpretive dance for a week?', 'Challenge accepted', 'Hard no', '💃', '🙅', 'draft', ARRAY['absurd'], 2),
('All pants are optional at work?', 'Freedom', 'Anarchy', '👖', '🏢', 'draft', ARRAY['absurd'], 1),
('The ocean is now spicy?', 'Kind of iconic', 'Environmental disaster', '🌊', '🌶️', 'draft', ARRAY['absurd'], 2),
('Pigeons are actually government surveillance drones?', 'Obviously', 'That''s paranoid', '🐦', '👁️', 'draft', ARRAY['absurd'], 1),
('All clocks now count down instead of up?', 'Efficient', 'Existentially horrifying', '⏲️', '😰', 'draft', ARRAY['absurd'], 2),
('Clouds are now edible but taste like cardboard?', 'Still would try', 'Disappointing', '☁️', '📦', 'draft', ARRAY['absurd'], 2),
('Everyone you meet gets a little theme song?', 'YES absolutely', 'That would be chaotic', '🎵', '😵', 'draft', ARRAY['absurd'], 1),
('All weather is now user-voted each morning?', 'Democracy works', 'Climate disaster', '🌤️', '🗳️', 'draft', ARRAY['absurd'], 2),
('Pillows gain sentience but still let you sleep on them?', 'Grateful', 'Slightly terrifying', '🛏️', '😬', 'draft', ARRAY['absurd'], 2),
('Everyone''s age floats above their head like a video game?', 'Convenient', 'Super rude', '🔢', '😤', 'draft', ARRAY['absurd'], 2),
('The sky permanently turns plaid?', 'Actually cool', 'Visually painful', '🌈', '😵', 'draft', ARRAY['absurd'], 1),
('All disagreements legally settled by thumb wrestling?', 'Fair system', 'Chaotic but interesting', '👍', '🤼', 'draft', ARRAY['absurd'], 2),
('Your shoes argue with you about your outfit choices?', 'Useful', 'Exhausting', '👟', '🗣️', 'draft', ARRAY['absurd'], 2),
('The ocean sends you a weekly newsletter?', 'Subscribe me', 'Unsubscribe', '🌊', '📧', 'draft', ARRAY['absurd'], 1),
('You can see a countdown of how long someone wants to talk?', 'Game changer', 'Rude', '⏱️', '🗣️', 'draft', ARRAY['absurd'], 2),
('Clouds are replaced by giant floating armchairs?', 'Whimsical', 'Physics crisis', '☁️', '🪑', 'draft', ARRAY['absurd'], 1),
('History textbooks rewritten as choose-your-own-adventure?', 'Educational revolution', 'Too inaccurate', '📚', '🎮', 'draft', ARRAY['absurd'], 3),
('Mountains can relocate but need 30 days notice?', 'Reasonable policy', 'Very confusing', '🏔️', '📋', 'draft', ARRAY['absurd'], 2),
('You earn coins for every good hair day?', 'Millionaire', 'Broke', '💇', '🪙', 'draft', ARRAY['absurd'], 1),
('Gravity reverses every Tuesday for one hour?', 'That would be fun', 'Absolute chaos', '🌍', '💥', 'draft', ARRAY['absurd'], 1),
('Everyone''s Google searches are displayed publicly for a day?', 'Society survives', 'Society collapses', '🔍', '😱', 'draft', ARRAY['absurd'], 2),
('Stairs play a different note with each step?', 'Delightful', 'Maddening', '🪜', '🎵', 'draft', ARRAY['absurd'], 1),
('You can speak to animals but they all speak in riddles?', 'Worth it', 'Useless', '🦊', '🧩', 'draft', ARRAY['absurd'], 2),
('All mirrors now show you 10 seconds in the future?', 'Useful', 'Unsettling', '🪞', '⏱️', 'draft', ARRAY['absurd'], 3),
('Every lie you tell turns your nose blue for 5 minutes?', 'Character growth', 'Chaos for politicians', '👃', '🔵', 'draft', ARRAY['absurd'], 2),
('Libraries are now illegal but bookstores are free?', 'Worth the trade', 'Terrible trade', '📚', '🏛️', 'draft', ARRAY['absurd'], 3),
('You wake up fluent in every language but forget your native one?', 'Worth it', 'Not worth it', '🌍', '🗣️', 'draft', ARRAY['absurd'], 3),
('Shadows now show what you were doing an hour ago?', 'Convenient', 'Privacy nightmare', '👥', '⏰', 'draft', ARRAY['absurd'], 3),
('All birds now speak in formal British English?', 'Charming', 'Disturbing', '🐦', '🎩', 'draft', ARRAY['absurd'], 1),
('You glow slightly when you''re lying?', 'Good for society', 'Terrible for me personally', '✨', '😬', 'draft', ARRAY['absurd'], 2),
('All math becomes optional in schools?', 'Finally', 'Civilization ends', '➕', '🏫', 'draft', ARRAY['absurd'], 3),
('Your dreams are broadcast as a TV show while you sleep?', 'I''d watch it', 'Never sleeping again', '💤', '📺', 'draft', ARRAY['absurd'], 3),
('Teleportation exists but you always arrive slightly damp?', 'Worth it', 'Hard pass', '⚡', '💧', 'draft', ARRAY['absurd'], 2),

-- ── SPORTS (32) ───────────────────────────────────────────────
('LeBron or Jordan: who is the true GOAT?', 'LeBron James', 'Michael Jordan', '👑', '🐐', 'draft', ARRAY['sports'], 4),
('Football or basketball?', 'Football', 'Basketball', '🏈', '🏀', 'draft', ARRAY['sports'], 1),
('"Football" should be called soccer or football?', 'Call it football', 'Call it soccer', '⚽', '🏟️', 'draft', ARRAY['sports'], 3),
('Watch sports live or on TV?', 'Live in person', 'On TV from home', '🏟️', '📺', 'draft', ARRAY['sports'], 2),
('Messi or Ronaldo?', 'Messi', 'Ronaldo', '⚽', '🌟', 'draft', ARRAY['sports'], 4),
('Olympics or FIFA World Cup?', 'Olympics', 'World Cup', '🥇', '🏆', 'draft', ARRAY['sports'], 3),
('Run a marathon or swim 2 miles?', 'Run a marathon', 'Swim 2 miles', '🏃', '🏊', 'draft', ARRAY['sports'], 3),
('Baseball or cricket?', 'Baseball', 'Cricket', '⚾', '🏏', 'draft', ARRAY['sports'], 3),
('Track and field or swimming at the Olympics?', 'Track and field', 'Swimming', '🏃', '🏊', 'draft', ARRAY['sports'], 2),
('Golf: brilliant or completely boring?', 'Actually brilliant', 'Completely boring', '⛳', '😴', 'draft', ARRAY['sports'], 3),
('Play a sport or watch one?', 'Play', 'Watch', '🏃', '📺', 'draft', ARRAY['sports'], 2),
('Be the fastest or the strongest athlete?', 'Fastest', 'Strongest', '⚡', '💪', 'draft', ARRAY['sports'], 2),
('Fantasy sports: fun hobby or ruining the sport?', 'Fun hobby', 'Ruining the sport', '📊', '🏈', 'draft', ARRAY['sports'], 3),
('Boxing or MMA?', 'Boxing', 'MMA', '🥊', '🥋', 'draft', ARRAY['sports'], 2),
('Skiing or snowboarding?', 'Skiing', 'Snowboarding', '⛷️', '🏂', 'draft', ARRAY['sports'], 2),
('Is yoga a sport?', 'Yes, it''s a sport', 'No, it''s not a sport', '🧘', '🤔', 'draft', ARRAY['sports'], 2),
('Should e-sports be in the Olympics?', 'Yes', 'No', '🎮', '🏅', 'draft', ARRAY['sports'], 4),
('Pro athletes are overpaid or deserve every penny?', 'Overpaid', 'Deserve it', '💰', '🏆', 'draft', ARRAY['sports'], 4),
('Tom Brady: greatest of all time or system quarterback?', 'Greatest ever', 'System QB', '🏈', '🤷', 'draft', ARRAY['sports'], 3),
('Rugby or American football?', 'Rugby', 'American football', '🏉', '🏈', 'draft', ARRAY['sports'], 2),
('Surfing or skateboarding?', 'Surfing', 'Skateboarding', '🏄', '🛹', 'draft', ARRAY['sports'], 2),
('Sports analytics: improving the game or ruining it?', 'Improving it', 'Ruining it', '📊', '🏆', 'draft', ARRAY['sports'], 4),
('Is chess a sport?', 'Yes', 'No', '♟️', '🤔', 'draft', ARRAY['sports'], 3),
('Would you run a 5K right now if forced to?', 'Let''s go', 'Absolutely not', '🏃', '💀', 'draft', ARRAY['sports'], 2),
('NASCAR or Formula 1?', 'NASCAR', 'Formula 1', '🏁', '🏎️', 'draft', ARRAY['sports'], 2),
('Medal sports or team sports more exciting to watch?', 'Medal sports', 'Team sports', '🥇', '🏆', 'draft', ARRAY['sports'], 2),
('Home team loyalty or root for the best team always?', 'Home team', 'Best team', '🏠', '🏆', 'draft', ARRAY['sports'], 2),
('Would you rather be an Olympian or a world champion in your sport?', 'Olympic gold', 'World champion', '🏅', '🌍', 'draft', ARRAY['sports'], 3),
('Underdog wins or dominant dynasty?', 'Underdog wins', 'Dynasty dominates', '💪', '👑', 'draft', ARRAY['sports'], 2),
('Best sport to play for fun: tennis or golf?', 'Tennis', 'Golf', '🎾', '⛳', 'draft', ARRAY['sports'], 2),
('Serena Williams: greatest athlete ever or just tennis GOAT?', 'Greatest athlete ever', 'Just tennis GOAT', '🎾', '🤔', 'draft', ARRAY['sports'], 3),
('Sports rivalries: healthy competition or toxic?', 'Healthy competition', 'Often toxic', '🔥', '🤝', 'draft', ARRAY['sports'], 3)
ON CONFLICT DO NOTHING;
