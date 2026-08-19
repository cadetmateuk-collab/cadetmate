-- Point activity_events.actor_id at profiles so PostgREST can embed actor info.
-- The original migration referenced auth.users, which PostgREST cannot join to public.profiles.

DO $$
DECLARE
  fk_name text;
BEGIN
  -- Drop existing FK on actor_id (likely to auth.users)
  SELECT c.conname INTO fk_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'activity_events'
    AND c.contype = 'f'
    AND pg_get_constraintdef(c.oid) ILIKE '%actor_id%'
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.activity_events DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

-- Clear orphan actor ids that would violate profiles FK
UPDATE public.activity_events ae
SET actor_id = NULL
WHERE actor_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = ae.actor_id);

ALTER TABLE public.activity_events
  ADD CONSTRAINT activity_events_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
