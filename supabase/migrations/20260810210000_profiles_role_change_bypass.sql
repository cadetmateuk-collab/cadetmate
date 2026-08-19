-- Allow trusted backends (SQL editor / service_role) to change privileged profile columns.
-- Previously only public.is_admin() could, which fails when auth.uid() is null
-- (Supabase SQL editor, service role, migrations).

CREATE OR REPLACE FUNCTION public.profiles_prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(auth.role(), '');
BEGIN
  -- App admins, service role, and DB owners (SQL editor / migrations) may change privileged cols
  IF public.is_admin()
     OR jwt_role = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin')
  THEN
    RETURN NEW;
  END IF;

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

  RETURN NEW;
END;
$$;
