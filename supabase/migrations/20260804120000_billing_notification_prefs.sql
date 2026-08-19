-- Stripe entitlement fields + notification preferences + XP backfill

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS premium_status TEXT DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_uidx
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_product BOOLEAN NOT NULL DEFAULT true,
  email_community BOOLEAN NOT NULL DEFAULT true,
  email_marketing BOOLEAN NOT NULL DEFAULT false,
  in_app_xp BOOLEAN NOT NULL DEFAULT true,
  in_app_billing BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users read own notification prefs"
    ON notification_preferences FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users upsert own notification prefs"
    ON notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users update own notification prefs"
    ON notification_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users insert own notifications"
    ON notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO user_gamification (user_id, total_xp, level, updated_at)
SELECT
  f.user_id,
  f.xp,
  GREATEST(1, FLOOR(f.xp / 500.0)::int + 1),
  now()
FROM flashcard_user_xp f
ON CONFLICT (user_id) DO UPDATE SET
  total_xp = GREATEST(user_gamification.total_xp, EXCLUDED.total_xp),
  level = GREATEST(user_gamification.level, EXCLUDED.level),
  updated_at = now();
