import { NextResponse } from 'next/server';
import { requireUserApi } from '@/lib/auth/require-user-api';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { ProgressSyncPayload, ProgressSyncResponse } from '@cadet-mate/shared';

export async function POST(request: Request) {
  const auth = await requireUserApi();
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  let body: ProgressSyncPayload;
  try {
    body = (await request.json()) as ProgressSyncPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const applied: ProgressSyncResponse['applied'] = {
    modules: 0,
    sections: 0,
    activitySeconds: 0,
    flashcards: 0,
    quizAnswers: 0,
  };

  for (const row of body.modules ?? []) {
    const { data: existing } = await supabaseAdmin
      .from('user_module_progress')
      .select('progress, completed')
      .eq('user_id', userId)
      .eq('module_id', row.module_id)
      .maybeSingle();
    const progress = Math.max(Number(existing?.progress ?? 0), Number(row.progress ?? 0));
    const completed = Boolean(existing?.completed) || Boolean(row.completed) || progress >= 100;
    await supabaseAdmin.from('user_module_progress').upsert(
      {
        user_id: userId,
        module_id: row.module_id,
        progress,
        completed,
        last_accessed: row.last_accessed,
      },
      { onConflict: 'user_id,module_id' },
    );
    applied.modules += 1;
  }

  for (const row of body.sections ?? []) {
    await supabaseAdmin.from('user_section_progress').upsert(
      {
        user_id: userId,
        module_id: row.module_id,
        section_index: row.section_index,
        completed_at: row.completed_at,
      },
      { onConflict: 'user_id,module_id,section_index' },
    );
    applied.sections += 1;
  }

  for (const row of body.activity ?? []) {
    const seconds = Math.max(0, Number(row.duration_seconds) || 0);
    if (!seconds) continue;
    await supabaseAdmin.from('user_activity_log').insert({
      user_id: userId,
      session_start: row.session_start,
      duration_seconds: seconds,
      page_path: row.page_path,
    });
    await supabaseAdmin.rpc('increment_user_time', { p_user_id: userId, p_seconds: seconds });
    applied.activitySeconds += seconds;
  }

  for (const row of body.flashcards ?? []) {
    const { data: existing } = await supabaseAdmin
      .from('flashcard_progress')
      .select('client_updated_at, repetitions')
      .eq('user_id', userId)
      .eq('card_id', row.card_id)
      .maybeSingle();
    const existingStamp = existing?.client_updated_at ? Date.parse(existing.client_updated_at) : 0;
    const incomingStamp = Date.parse(row.client_updated_at);
    if (existing && Number.isFinite(existingStamp) && Number.isFinite(incomingStamp) && incomingStamp < existingStamp) {
      continue;
    }
    await supabaseAdmin.from('flashcard_progress').upsert(
      {
        user_id: userId,
        card_id: row.card_id,
        pack_id: row.pack_id,
        interval_days: row.interval_days,
        repetitions: row.repetitions,
        ease_factor: row.ease_factor,
        next_review: row.next_review,
        last_quality: row.last_quality,
        times_viewed: row.times_viewed,
        times_correct: row.times_correct,
        mastery: row.mastery,
        client_updated_at: row.client_updated_at,
      },
      { onConflict: 'user_id,card_id' },
    );
    applied.flashcards += 1;
  }

  for (const row of body.quizAnswers ?? []) {
    const { data: existing } = await supabaseAdmin
      .from('daily_question_answers')
      .select('correct, selected_answer')
      .eq('user_id', userId)
      .eq('question_id', row.question_id)
      .maybeSingle();
    if (existing?.correct) {
      applied.quizAnswers += 1;
      continue;
    }
    const correct = Boolean(existing?.correct) || Boolean(row.correct);
    await supabaseAdmin.from('daily_question_answers').upsert(
      {
        user_id: userId,
        question_id: row.question_id,
        selected_answer: row.selected_answer,
        correct,
      },
      { onConflict: 'user_id,question_id' },
    );
    applied.quizAnswers += 1;
  }

  return NextResponse.json({ applied } satisfies ProgressSyncResponse);
}
