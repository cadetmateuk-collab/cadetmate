-- content_packages is a server-side cache of offline manifests.
-- Session-check builds packages in the Next API after a licence check.
-- RLS was enabled with zero policies, which locks the Data API but reads as
-- an unfinished table. Keep that lock explicit, and drop anon/authenticated
-- grants so the table stays closed if RLS is ever turned off.
-- The service role bypasses RLS and keeps its grants for server code.

revoke all on table public.content_packages from anon, authenticated;

drop policy if exists content_packages_no_client_access on public.content_packages;

create policy content_packages_no_client_access
  on public.content_packages
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);
