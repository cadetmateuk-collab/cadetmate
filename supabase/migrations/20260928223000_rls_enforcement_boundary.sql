-- Make the database the enforcement boundary for fields the app was only hiding.
-- Client roles keep row access where the product needs it. Sensitive columns
-- and score fields are no longer writable or readable just because the row is.

-- stripe_events is written only by the Stripe webhook via the service role.
revoke all on table public.stripe_events from anon, authenticated;

drop policy if exists stripe_events_no_client_access on public.stripe_events;

create policy stripe_events_no_client_access
  on public.stripe_events
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

-- fc_is_admin used to trust the uuid argument, so anyone could pass an admin id.
create or replace function public.fc_is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and auth.uid() is not null
      and (uid is null or uid = auth.uid())
      and p.role::text = 'admin'
  );
$$;

-- Answer keys are not part of the public row. Staff read them through the
-- Next admin API (service role). Learners get one answer from grade/reveal.
revoke select on table public.daily_questions from anon, authenticated;
grant select (id, question_date, question, options, created_at)
  on public.daily_questions to anon, authenticated;

create or replace function public.grade_daily_question(p_question_id uuid, p_selected text)
returns table (correct boolean, selected_answer text, correct_answer text, explanation text)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := (timezone('utc', now()))::date;
  v_answer text;
  v_explanation text;
  existing public.daily_question_answers%rowtype;
  is_correct boolean;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_selected is null or length(btrim(p_selected)) = 0 or length(p_selected) > 500 then
    raise exception 'Invalid answer';
  end if;

  select a.* into existing
  from public.daily_question_answers a
  where a.user_id = uid and a.question_date = today;

  if found then
    if existing.question_id is distinct from p_question_id then
      raise exception 'Already answered today';
    end if;
    return query
      select existing.correct, existing.selected_answer, dq.correct_answer, dq.explanation
      from public.daily_questions dq
      where dq.id = existing.question_id;
    return;
  end if;

  select dq.correct_answer, dq.explanation into v_answer, v_explanation
  from public.daily_questions dq
  where dq.id = p_question_id;
  if not found then
    raise exception 'Question not found';
  end if;

  is_correct := btrim(p_selected) = v_answer;
  insert into public.daily_question_answers (
    user_id, question_id, question_date, selected_answer, correct
  ) values (
    uid, p_question_id, today, btrim(p_selected), is_correct
  );

  return query
    select is_correct, btrim(p_selected), v_answer, v_explanation;
end;
$$;

create or replace function public.daily_question_feedback(p_question_id uuid)
returns table (correct boolean, selected_answer text, correct_answer text, explanation text)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := (timezone('utc', now()))::date;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  return query
    select a.correct, a.selected_answer, q.correct_answer, q.explanation
    from public.daily_question_answers a
    join public.daily_questions q on q.id = a.question_id
    where a.user_id = uid
      and a.question_date = today
      and a.question_id = p_question_id;
end;
$$;

create or replace function public.reveal_daily_question(p_question_id uuid)
returns table (correct_answer text, explanation text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_premium_access() then
    raise exception 'Premium access required';
  end if;

  return query
    select q.correct_answer, q.explanation
    from public.daily_questions q
    where q.id = p_question_id;
end;
$$;

revoke all on function public.grade_daily_question(uuid, text) from public, anon;
revoke all on function public.daily_question_feedback(uuid) from public, anon;
revoke all on function public.reveal_daily_question(uuid) from public, anon;
grant execute on function public.grade_daily_question(uuid, text) to authenticated;
grant execute on function public.daily_question_feedback(uuid) to authenticated;
grant execute on function public.reveal_daily_question(uuid) to authenticated;

create or replace function public.protect_daily_answer_grade()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    raise exception 'Answers are recorded by grade_daily_question';
  end if;
  new.user_id := old.user_id;
  new.question_id := old.question_id;
  new.question_date := old.question_date;
  new.selected_answer := old.selected_answer;
  new.correct := old.correct;
  return new;
end;
$$;

drop trigger if exists protect_daily_answer_grade on public.daily_question_answers;
create trigger protect_daily_answer_grade
  before insert or update on public.daily_question_answers
  for each row
  execute function public.protect_daily_answer_grade();

-- Own-row updates cannot change scores, authorship, or restore deleted content.
create or replace function public.protect_community_content_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.vote_score := 0;
    new.user_id := auth.uid();
    new.is_deleted := false;
    if tg_table_name = 'posts' then
      new.comment_count := 0;
    end if;
    if new.status is null or new.status::text not in ('published', 'pending', 'flagged') then
      new.status := 'published';
    end if;
    return new;
  end if;

  new.user_id := old.user_id;
  new.vote_score := old.vote_score;
  new.created_at := old.created_at;
  if tg_table_name = 'posts' then
    new.comment_count := old.comment_count;
  end if;
  if tg_table_name = 'comments' then
    new.depth := old.depth;
    new.post_id := old.post_id;
    new.parent_id := old.parent_id;
  end if;

  if old.is_deleted then
    new.is_deleted := true;
    new.status := old.status;
  elsif new.is_deleted is true then
    new.is_deleted := true;
    new.status := 'removed';
  elsif new.status is null or new.status::text not in ('published', 'pending', 'flagged', 'removed') then
    new.status := old.status;
  end if;

  return new;
end;
$$;

drop trigger if exists aaa_protect_community_content on public.posts;
create trigger aaa_protect_community_content
  before insert or update on public.posts
  for each row
  execute function public.protect_community_content_columns();

drop trigger if exists aaa_protect_community_content on public.comments;
create trigger aaa_protect_community_content
  before insert or update on public.comments
  for each row
  execute function public.protect_community_content_columns();

create or replace function public.protect_user_gamification()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  previous integer := case when tg_op = 'UPDATE' then coalesce(old.total_xp, 0) else 0 end;
  cap integer := 5000;
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') or public.is_admin() then
    return new;
  end if;
  if coalesce(new.total_xp, 0) > previous + cap then
    new.total_xp := previous + cap;
  end if;
  if coalesce(new.total_xp, 0) < previous then
    new.total_xp := previous;
  end if;
  new.level := (floor(coalesce(new.total_xp, 0) / 500) + 1)::integer;
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
    new.exam_readiness_score := old.exam_readiness_score;
  else
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists protect_user_gamification on public.user_gamification;
create trigger protect_user_gamification
  before insert or update on public.user_gamification
  for each row
  execute function public.protect_user_gamification();

create or replace function public.protect_flashcard_user_xp()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  previous integer := case when tg_op = 'UPDATE' then coalesce(old.xp, 0) else 0 end;
  cap integer := 5000;
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') or public.is_admin() then
    return new;
  end if;
  if coalesce(new.xp, 0) > previous + cap then
    new.xp := previous + cap;
  end if;
  if coalesce(new.xp, 0) < previous then
    new.xp := previous;
  end if;
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
  else
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists protect_flashcard_user_xp on public.flashcard_user_xp;
create trigger protect_flashcard_user_xp
  before insert or update on public.flashcard_user_xp
  for each row
  execute function public.protect_flashcard_user_xp();

create or replace function public.protect_user_statistics()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.total_time_seconds := 0;
    new.modules_started := 0;
    new.modules_completed := 0;
    new.daily_streak := 0;
    return new;
  end if;
  new.user_id := old.user_id;
  new.total_time_seconds := old.total_time_seconds;
  new.modules_started := old.modules_started;
  new.modules_completed := old.modules_completed;
  new.daily_streak := old.daily_streak;
  return new;
end;
$$;

drop trigger if exists protect_user_statistics on public.user_statistics;
create trigger protect_user_statistics
  before insert or update on public.user_statistics
  for each row
  execute function public.protect_user_statistics();
