import type { ProgressSyncPayload, ProgressSyncResponse } from '@cadet-mate/shared';
import { apiRequest } from './APIClient';
import { ConnectivityManager } from './ConnectivityManager';
import { getDb } from './db';
import { OfflineModeError } from './errors';
import { ProgressStore } from './ProgressStore';
import { getSupabase } from '../supabase';

export const SyncManager = {
  async buildPayload(): Promise<ProgressSyncPayload> {
    const db = await getDb();
    const modules = await db.getAllAsync<{
      module_id: string;
      progress: number;
      completed: number;
      last_accessed: string | null;
      client_updated_at: string;
    }>('SELECT * FROM module_progress');
    const sections = await db.getAllAsync<{
      module_id: string;
      section_index: number;
      completed_at: string;
    }>('SELECT * FROM section_progress');
    const activity = await db.getAllAsync<{
      session_start: string;
      duration_seconds: number;
      page_path: string | null;
    }>('SELECT session_start, duration_seconds, page_path FROM activity_log WHERE synced = 0');
    const flashcards = await db.getAllAsync<{
      card_id: string;
      pack_id: string;
      interval_days: number;
      repetitions: number;
      ease_factor: number;
      next_review: string;
      last_quality: number | null;
      times_viewed: number;
      times_correct: number;
      mastery: number;
      client_updated_at: string;
    }>('SELECT * FROM flashcard_progress WHERE synced = 0');
    const quizAnswers = await db.getAllAsync<{
      question_id: string;
      selected_answer: string;
      correct: number;
      client_updated_at: string;
    }>('SELECT * FROM quiz_answers WHERE synced = 0');

    return {
      modules: modules.map((row) => ({
        module_id: row.module_id,
        progress: row.progress,
        completed: Boolean(row.completed),
        last_accessed: row.last_accessed,
        client_updated_at: row.client_updated_at,
      })),
      sections,
      activity,
      flashcards,
      quizAnswers: quizAnswers.map((row) => ({
        question_id: row.question_id,
        selected_answer: row.selected_answer,
        correct: Boolean(row.correct),
        client_updated_at: row.client_updated_at,
      })),
    };
  },

  async estimatedUploadBytes() {
    const payload = await this.buildPayload();
    return JSON.stringify(payload).length;
  },

  async sync(): Promise<ProgressSyncResponse> {
    if (!ConnectivityManager.canUseNetwork()) throw new OfflineModeError();
    const payload = await this.buildPayload();
    const result = await apiRequest<ProgressSyncResponse>('/api/mobile/sync', {
      method: 'POST',
      body: payload,
    });
    const db = await getDb();
    await db.runAsync('UPDATE activity_log SET synced = 1 WHERE synced = 0');
    await db.runAsync('UPDATE flashcard_progress SET synced = 1 WHERE synced = 0');
    await db.runAsync('UPDATE quiz_answers SET synced = 1 WHERE synced = 0');
    await pullRemoteProgress().catch(() => {
      /* Remote tables may lag a migration; local progress is already uploaded. */
    });
    return result;
  },
};

async function pullRemoteProgress() {
  const { data: sessionData } = await getSupabase().auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return;

  const [{ data: modules }, { data: sections }, { data: cards }, { data: quiz }] = await Promise.all([
    getSupabase()
      .from('user_module_progress')
      .select('module_id, progress, completed, last_accessed')
      .eq('user_id', userId),
    getSupabase().from('user_section_progress').select('module_id, section_index').eq('user_id', userId),
    getSupabase()
      .from('flashcard_progress')
      .select(
        'card_id, pack_id, interval_days, repetitions, ease_factor, next_review, last_quality, times_viewed, times_correct, mastery',
      )
      .eq('user_id', userId),
    getSupabase()
      .from('daily_question_answers')
      .select('question_id, selected_answer, correct')
      .eq('user_id', userId),
  ]);

  for (const row of modules ?? []) {
    if (!row.module_id) continue;
    await ProgressStore.saveModule({
      moduleId: row.module_id,
      progress: Number(row.progress) || 0,
      completed: Boolean(row.completed),
      lastAccessed: row.last_accessed,
    });
  }
  for (const row of sections ?? []) {
    if (!row.module_id) continue;
    await ProgressStore.saveSection(row.module_id, row.section_index);
  }
  for (const row of cards ?? []) {
    await ProgressStore.saveFlashcard({
      card_id: row.card_id,
      pack_id: row.pack_id,
      interval_days: Number(row.interval_days) || 0,
      repetitions: Number(row.repetitions) || 0,
      ease_factor: Number(row.ease_factor) || 2.5,
      next_review: row.next_review,
      last_quality: row.last_quality,
      times_viewed: Number(row.times_viewed) || 0,
      times_correct: Number(row.times_correct) || 0,
      mastery: Number(row.mastery) || 0,
    });
  }
  for (const row of quiz ?? []) {
    const local = await ProgressStore.quizAnswer(row.question_id);
    if (local?.correct) continue;
    await ProgressStore.saveQuizAnswer(row.question_id, row.selected_answer, Boolean(row.correct));
  }
}
