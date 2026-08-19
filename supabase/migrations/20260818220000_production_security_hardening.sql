-- Production security hardening: close open RLS, lock billing columns,
-- enforce entitlements at the data layer, and fix pack fulfillment schema.

-- ── Stripe ledger + pack session id ──────────────────────────────────────────

ALTER TABLE public.flashcard_pack_ownership
  ADD COLUMN IF NOT EXISTS stripe_session_id text;

CREATE UNIQUE INDEX IF NOT EXISTS flashcard_pack_ownership_stripe_session_uidx
  ON public.flashcard_pack_ownership (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.stripe_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- ── Drop dangerously open policies ───────────────────────────────────────────

DROP POLICY IF EXISTS "Allow all on blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can do everything" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can delete posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can insert posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update posts" ON public.blog_posts;

DROP POLICY IF EXISTS "Service role full access" ON public.notices;
DROP POLICY IF EXISTS "Public read active notices" ON public.notices;

DROP POLICY IF EXISTS "Authenticated users can modify trb_tasks" ON public.trb_tasks;
DROP POLICY IF EXISTS "Public can read trb_tasks" ON public.trb_tasks;

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;

DROP POLICY IF EXISTS "read_modules" ON public.modules;
DROP POLICY IF EXISTS "Public can read slugs - sea_survival" ON public.sea_survival;
DROP POLICY IF EXISTS "Premium read - sea_survival" ON public.sea_survival;

DROP POLICY IF EXISTS "Public can read all progress" ON public.user_section_progress;
DROP POLICY IF EXISTS "Public read user statistics" ON public.user_statistics;

DROP POLICY IF EXISTS "moderation_insert_auth" ON public.moderation_logs;
DROP POLICY IF EXISTS "Users insert own user achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "community_profiles_update_own" ON public.community_user_profiles;
DROP POLICY IF EXISTS "fc_cards_read" ON public.flashcards;

-- ── Profiles: own + admin only; public display via view ──────────────────────

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = false) AS
SELECT id, full_name, avatar_kind, avatar_preset, avatar_color
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

REVOKE SELECT, INSERT, UPDATE ON public.profiles FROM anon;

REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.profiles FROM authenticated;
REVOKE INSERT (stripe_customer_id, stripe_subscription_id) ON public.profiles FROM authenticated;
REVOKE UPDATE (stripe_customer_id, stripe_subscription_id) ON public.profiles FROM authenticated;

-- ── Modules catalog (metadata only, bypasses RLS for listings) ───────────────

CREATE OR REPLACE VIEW public.modules_catalog
WITH (security_invoker = false) AS
SELECT
  id, title, slug, description, category, subcategory, hidden, is_premium,
  is_new, is_featured, difficulty, estimated_hours, total_lessons,
  accent_color, image_url, tags, created_at, updated_at, content_version
FROM public.modules
WHERE COALESCE(hidden, false) = false;

GRANT SELECT ON public.modules_catalog TO anon, authenticated, service_role;

CREATE POLICY read_modules_entitled ON public.modules
  FOR SELECT TO anon, authenticated
  USING (
    public.is_staff()
    OR (
      COALESCE(hidden, false) = false
      AND (COALESCE(is_premium, false) = false OR public.is_premium_access())
    )
  );

-- ── Sea survival + TRB: premium / staff ──────────────────────────────────────

CREATE POLICY sea_survival_read_entitled ON public.sea_survival
  FOR SELECT TO anon, authenticated
  USING (
    COALESCE(hidden, false) = false
    AND (public.is_premium_access() OR public.is_staff())
  );

CREATE POLICY trb_tasks_read_entitled ON public.trb_tasks
  FOR SELECT TO anon, authenticated
  USING (public.is_premium_access() OR public.is_staff());

-- ── Flashcard cards: free packs public; premium packs require ownership ──────

CREATE POLICY fc_cards_read_entitled ON public.flashcards
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.flashcard_packs p
      WHERE p.id = flashcards.pack_id
        AND (p.status = 'published'::fc_pack_status OR public.is_staff() OR public.fc_is_admin(auth.uid()))
        AND (
          COALESCE(p.is_premium, false) = false
          OR public.is_staff()
          OR public.fc_is_admin(auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.flashcard_pack_ownership o
            WHERE o.pack_id = p.id
              AND o.user_id = auth.uid()
          )
        )
    )
  );

-- ── Progress / stats: own-row only ───────────────────────────────────────────

-- existing own policies remain; public-all dropped above

-- ── Moderation insert: staff only ────────────────────────────────────────────

CREATE POLICY moderation_insert_staff ON public.moderation_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() OR public.community_is_admin());

-- ── increment_user_time: require caller identity ─────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_user_time(p_user_id uuid, p_seconds integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  IF p_seconds IS NULL OR p_seconds <= 0 THEN
    RETURN;
  END IF;
  p_seconds := LEAST(p_seconds, 3600);
  INSERT INTO user_statistics (user_id, total_time_seconds)
  VALUES (p_user_id, p_seconds)
  ON CONFLICT (user_id) DO UPDATE SET
    total_time_seconds = COALESCE(user_statistics.total_time_seconds, 0) + EXCLUDED.total_time_seconds,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'free'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_last_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_statistics
  SET last_activity_date = CURRENT_DATE
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.community_check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_count integer,
  p_window_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count INTEGER;
  window_mins integer := GREATEST(COALESCE(p_window_minutes, 1), 1);
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN false;
  END IF;
  IF p_action = 'post' THEN
    SELECT COUNT(*) INTO recent_count FROM posts
    WHERE user_id = p_user_id AND created_at > now() - (window_mins || ' minutes')::interval;
  ELSE
    SELECT COUNT(*) INTO recent_count FROM comments
    WHERE user_id = p_user_id AND created_at > now() - (window_mins || ' minutes')::interval;
  END IF;
  RETURN recent_count < p_max_count;
END;
$$;

-- ── Revoke dangerous DEFINER EXECUTE from PUBLIC/anon ────────────────────────

REVOKE ALL ON FUNCTION public.community_recalculate_vote_score(public.community_vote_target, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.community_on_comment_insert() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.community_on_comment_update_delete() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.community_on_post_change() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.community_on_vote_change() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.community_ensure_user_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_on_comment_insert() TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_on_comment_update_delete() TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_on_post_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_on_vote_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_ensure_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_last_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.profiles_prevent_privilege_escalation() TO authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_user_last_activity() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.profiles_prevent_privilege_escalation() FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.increment_user_time(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_user_time(uuid, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.claim_free_flashcard_pack(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_free_flashcard_pack(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.community_check_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_check_rate_limit(uuid, text, integer, integer) TO authenticated;

-- Keep helper predicates executable (used inside RLS policies)
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_premium_access() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.community_is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fc_is_admin(uuid) TO anon, authenticated;

-- ── Storage: staff write; public read for media only ─────────────────────────

DROP POLICY IF EXISTS "fc_storage_write" ON storage.objects;
DROP POLICY IF EXISTS "fc_storage_read" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload trb images" ON storage.objects;

CREATE POLICY fc_storage_read_media ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'flashcards'
    AND (
      name ~* '\.(png|jpe?g|webp|gif|svg|avif|mp3|wav|webm)$'
      OR public.is_staff()
      OR public.fc_is_admin(auth.uid())
    )
  );

CREATE POLICY fc_storage_staff_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'flashcards' AND (public.is_staff() OR public.fc_is_admin(auth.uid())));

CREATE POLICY fc_storage_staff_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'flashcards' AND (public.is_staff() OR public.fc_is_admin(auth.uid())))
  WITH CHECK (bucket_id = 'flashcards' AND (public.is_staff() OR public.fc_is_admin(auth.uid())));

CREATE POLICY fc_storage_staff_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'flashcards' AND (public.is_staff() OR public.fc_is_admin(auth.uid())));

CREATE POLICY trb_images_staff_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'trb-images' AND public.is_staff());
