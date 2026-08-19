-- Content role + activity audit log + safe Content delete restrictions
-- Apply via Supabase SQL editor or CLI when available.

-- Helper: current profile role
CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_profile_role() = 'admin', false)
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_profile_role() IN ('admin', 'content'), false)
$$;

CREATE OR REPLACE FUNCTION public.is_premium_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_profile_role() IN ('premium', 'content', 'admin'), false)
$$;

-- Widen profiles.role to allow 'content' (check constraint or enum)
DO $$
DECLARE
  con text;
  typ text;
BEGIN
  SELECT c.conname INTO con
  FROM pg_constraint c
  WHERE c.conrelid = 'public.profiles'::regclass
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%role%'
  LIMIT 1;

  IF con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', con);
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('free', 'basic', 'premium', 'content', 'admin'));
  END IF;

  SELECT udt_name INTO typ
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role';

  IF typ IS NOT NULL AND typ NOT IN ('text', 'varchar', 'character varying') THEN
    BEGIN
      EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', typ, 'content');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- Activity / audit log
CREATE TABLE IF NOT EXISTS public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  entity_title text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  user_agent text
);

CREATE INDEX IF NOT EXISTS activity_events_created_at_idx ON public.activity_events (created_at DESC);
CREATE INDEX IF NOT EXISTS activity_events_actor_id_idx ON public.activity_events (actor_id);
CREATE INDEX IF NOT EXISTS activity_events_action_idx ON public.activity_events (action);
CREATE INDEX IF NOT EXISTS activity_events_entity_idx ON public.activity_events (entity_type, entity_id);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activity_events_admin_select ON public.activity_events;
CREATE POLICY activity_events_admin_select ON public.activity_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS activity_events_actor_insert ON public.activity_events;
CREATE POLICY activity_events_actor_insert ON public.activity_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id OR public.is_admin());

DROP POLICY IF EXISTS activity_events_admin_delete ON public.activity_events;
CREATE POLICY activity_events_admin_delete ON public.activity_events
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Content role: block DELETE only on tables that already have RLS enabled.
-- Never enable RLS here without SELECT policies — that would hide content from learners.
DO $$
DECLARE
  t text;
  rls_on boolean;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'modules',
    'categories',
    'blog_posts',
    'notices',
    'daily_questions',
    'trb_tasks',
    'sea_survival',
    'flashcard_packs',
    'flashcards'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;

    SELECT c.relrowsecurity INTO rls_on
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = t;

    IF COALESCE(rls_on, false) THEN
      EXECUTE format('DROP POLICY IF EXISTS content_no_delete ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY content_no_delete ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_admin())',
        t
      );
      -- Staff write policies (permissive) — safe alongside existing admin policies
      EXECUTE format('DROP POLICY IF EXISTS staff_insert ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY staff_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_staff())',
        t
      );
      EXECUTE format('DROP POLICY IF EXISTS staff_update ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY staff_update ON public.%I FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff())',
        t
      );
    END IF;
  END LOOP;
END $$;
