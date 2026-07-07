-- Category slug for SEO-friendly URLs: /free-content/{category_slug}/{slug}
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS category_slug text;

UPDATE blog_posts
SET category_slug = trim(both '-' from regexp_replace(lower(trim(category)), '[^a-z0-9]+', '-', 'g'))
WHERE category_slug IS NULL OR category_slug = '';

UPDATE blog_posts
SET category_slug = 'general'
WHERE category_slug IS NULL OR category_slug = '';
