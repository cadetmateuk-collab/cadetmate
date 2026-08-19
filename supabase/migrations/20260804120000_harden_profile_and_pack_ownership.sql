-- Harden profile privilege escalation + free flashcard pack claims
-- Applied via Supabase MCP; kept in repo for history.

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile safe cols"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.profiles_prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Cannot change role';
    END IF;
    IF NEW.premium_status IS DISTINCT FROM OLD.premium_status THEN
      RAISE EXCEPTION 'Cannot change premium_status';
    END IF;
    IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
      RAISE EXCEPTION 'Cannot change stripe_customer_id';
    END IF;
    IF NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id THEN
      RAISE EXCEPTION 'Cannot change stripe_subscription_id';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Cannot change email via profiles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_prevent_privilege_escalation();

DROP POLICY IF EXISTS "fc_own_self_write" ON public.flashcard_pack_ownership;

CREATE OR REPLACE FUNCTION public.claim_free_flashcard_pack(p_pack_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  pack record;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, price_cents, stripe_price_id
  INTO pack
  FROM public.flashcard_packs
  WHERE id = p_pack_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pack not found';
  END IF;

  IF COALESCE(pack.price_cents, 0) > 0 OR (pack.stripe_price_id IS NOT NULL AND pack.stripe_price_id <> '') THEN
    RAISE EXCEPTION 'Pack is not free';
  END IF;

  INSERT INTO public.flashcard_pack_ownership (user_id, pack_id, source)
  VALUES (uid, p_pack_id, 'free')
  ON CONFLICT (user_id, pack_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_free_flashcard_pack(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_free_flashcard_pack(uuid) TO authenticated;
