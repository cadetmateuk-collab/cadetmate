-- Content versioning for offline packages, plus flashcard LWW stamp.

alter table public.modules
  add column if not exists content_version integer;

alter table public.flashcard_packs
  add column if not exists content_version integer;

alter table public.blog_posts
  add column if not exists content_version integer;

alter table public.sea_survival
  add column if not exists content_version integer;

alter table public.flashcard_progress
  add column if not exists client_updated_at timestamptz;
