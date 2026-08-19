-- Offline content catalog (optional cache for package manifests).
-- Session-check can compute manifests on the fly if this table is empty.

create table if not exists public.content_packages (
  kind text not null,
  content_id text not null,
  version integer not null,
  title text not null,
  slug text not null,
  is_premium boolean not null default false,
  total_bytes bigint not null default 0,
  bytes_estimated boolean not null default false,
  manifest jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (kind, content_id, version)
);

alter table public.content_packages enable row level security;

-- Packages are served via Next APIs after licence checks, not direct client select.
