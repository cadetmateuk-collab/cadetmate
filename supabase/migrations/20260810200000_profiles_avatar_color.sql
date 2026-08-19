-- Avatar accent colour for initials / preset tint (any CSS hex).
alter table public.profiles
  add column if not exists avatar_color text;

comment on column public.profiles.avatar_color is
  'Optional #RRGGBB accent for the user avatar background.';
