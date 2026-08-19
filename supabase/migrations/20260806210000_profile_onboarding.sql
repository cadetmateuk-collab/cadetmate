-- Profile onboarding fields for multi-step signup

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS training_phase text,
  ADD COLUMN IF NOT EXISTS nautical_college text,
  ADD COLUMN IF NOT EXISTS learning_interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS avatar_kind text NOT NULL DEFAULT 'initials',
  ADD COLUMN IF NOT EXISTS avatar_preset text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- updated_at may already exist from billing entitlements; add if missing
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_avatar_kind_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_avatar_kind_check
      CHECK (avatar_kind IN ('initials', 'preset'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profiles_updated_at();

COMMENT ON COLUMN public.profiles.training_phase IS 'Cadet training phase selected during onboarding';
COMMENT ON COLUMN public.profiles.nautical_college IS 'Nautical college name (from list or custom)';
COMMENT ON COLUMN public.profiles.learning_interests IS 'Topics the user wants to learn about';
COMMENT ON COLUMN public.profiles.referral_source IS 'How the user heard about CadetMate';
COMMENT ON COLUMN public.profiles.avatar_kind IS 'initials or preset avatar';
COMMENT ON COLUMN public.profiles.avatar_preset IS 'Preset avatar id when avatar_kind = preset';
COMMENT ON COLUMN public.profiles.phone_number IS 'Optional phone for WhatsApp community invite';
COMMENT ON COLUMN public.profiles.whatsapp_opt_in IS 'User opted in to WhatsApp group via onboarding phone';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'True after multi-step onboarding finishes';
