-- The ALL-roles admin policy used EXISTS (SELECT ... FROM profiles ...).
-- Anon cannot SELECT profiles (revoked in production hardening), so Postgres
-- errors while evaluating that policy and the whole blog_posts query fails.
-- Public listing and the admin tab both use the anon key, so both showed empty.

DROP POLICY IF EXISTS "Admin full access - blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Public can view visible posts" ON public.blog_posts;

CREATE POLICY blog_posts_public_read
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (COALESCE(hidden, false) = false);

CREATE POLICY blog_posts_staff_select
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

CREATE POLICY blog_posts_admin_all
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
