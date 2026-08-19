-- First-party privacy-conscious page view analytics (no unnecessary PII)
CREATE TABLE IF NOT EXISTS public.site_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  path text NOT NULL,
  referrer text,
  device text,
  browser text,
  os text,
  screen text,
  country text,
  session_id text,
  visitor_hash text,
  duration_ms integer,
  is_bounce boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS site_page_views_created_at_idx ON public.site_page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS site_page_views_path_idx ON public.site_page_views (path);
CREATE INDEX IF NOT EXISTS site_page_views_session_idx ON public.site_page_views (session_id);
CREATE INDEX IF NOT EXISTS site_page_views_visitor_idx ON public.site_page_views (visitor_hash);

ALTER TABLE public.site_page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_page_views_admin_select ON public.site_page_views;
CREATE POLICY site_page_views_admin_select ON public.site_page_views
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Inserts happen via service role from the collect API (bypasses RLS).

-- Optional homepage CMS blocks (structured; only expose real keys in admin UI)
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text,
  body text,
  cta_label text,
  cta_href text,
  sort_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS homepage_sections_staff_select ON public.homepage_sections;
CREATE POLICY homepage_sections_staff_select ON public.homepage_sections
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS homepage_sections_staff_write ON public.homepage_sections;
CREATE POLICY homepage_sections_staff_write ON public.homepage_sections
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

INSERT INTO public.homepage_sections (key, title, body, cta_label, cta_href, sort_order, visible)
VALUES
  ('hero', 'Hero', 'Primary marketing headline and CTA on the public homepage.', 'Get started', '/auth?mode=signup', 10, true),
  ('featured', 'Featured content', 'Highlight free articles or resources on the homepage.', 'Browse free content', '/free-content', 20, true),
  ('announcement', 'Announcement bar', 'Optional site-wide announcement.', null, null, 5, false),
  ('promo', 'Promo section', 'Premium upgrade / product promo block.', 'View pricing', '/pricing', 30, true)
ON CONFLICT (key) DO NOTHING;
