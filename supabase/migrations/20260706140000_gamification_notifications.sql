-- Gamification & notifications for CadetMate platform overhaul
-- Extends existing user_statistics and flashcard_user_xp

-- User gamification profile (unified XP across platform)
CREATE TABLE IF NOT EXISTS user_gamification (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  daily_goal_minutes INTEGER NOT NULL DEFAULT 30,
  weekly_goal_minutes INTEGER NOT NULL DEFAULT 180,
  daily_minutes_today INTEGER NOT NULL DEFAULT 0,
  weekly_minutes INTEGER NOT NULL DEFAULT 0,
  last_daily_reset DATE,
  last_weekly_reset DATE,
  exam_readiness_score NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Achievement definitions
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  xp_reward INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'general',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User unlocked achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  href TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;

-- Saved community posts
CREATE TABLE IF NOT EXISTS saved_posts (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- RLS
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own gamification" ON user_gamification FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own gamification" ON user_gamification FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own gamification" ON user_gamification FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read achievements" ON achievements FOR SELECT USING (true);

CREATE POLICY "Users read own user achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own user achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users manage own saved posts" ON saved_posts FOR ALL USING (auth.uid() = user_id);

-- Seed achievements
INSERT INTO achievements (id, title, description, icon, xp_reward, category, requirement_type, requirement_value, sort_order) VALUES
  ('first_login', 'Welcome Aboard', 'Create your CadetMate account', 'anchor', 50, 'onboarding', 'login', 1, 1),
  ('streak_3', 'Three Day Streak', 'Study 3 days in a row', 'flame', 100, 'streak', 'daily_streak', 3, 10),
  ('streak_7', 'Week Warrior', 'Study 7 days in a row', 'flame', 250, 'streak', 'daily_streak', 7, 11),
  ('streak_30', 'Monthly Mariner', 'Study 30 days in a row', 'flame', 1000, 'streak', 'daily_streak', 30, 12),
  ('module_complete', 'First Module', 'Complete your first learning module', 'book', 150, 'learning', 'modules_completed', 1, 20),
  ('modules_5', 'Dedicated Cadet', 'Complete 5 learning modules', 'book', 500, 'learning', 'modules_completed', 5, 21),
  ('first_post', 'Community Voice', 'Create your first community post', 'message', 75, 'community', 'posts_created', 1, 30),
  ('quiz_master', 'Quiz Starter', 'Complete 10 quizzes', 'target', 200, 'practice', 'quizzes_completed', 10, 40),
  ('premium_member', 'Premium Cadet', 'Upgrade to Premium', 'sparkles', 500, 'premium', 'premium', 1, 50)
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
