import { getDb } from './db';

export const ProgressStore = {
  async saveModule(opts: {
    moduleId: string;
    progress: number;
    completed?: boolean;
    lastAccessed?: string;
  }) {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO module_progress (module_id, progress, completed, last_accessed, client_updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(module_id) DO UPDATE SET
         progress = MAX(progress, excluded.progress),
         completed = MAX(completed, excluded.completed),
         last_accessed = excluded.last_accessed,
         client_updated_at = excluded.client_updated_at`,
      [opts.moduleId, opts.progress, opts.completed ? 1 : 0, opts.lastAccessed ?? now, now],
    );
  },

  async saveSection(moduleId: string, sectionIndex: number) {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO section_progress (module_id, section_index, completed_at) VALUES (?, ?, ?)`,
      [moduleId, sectionIndex, new Date().toISOString()],
    );
  },

  async clearSection(moduleId: string, sectionIndex: number) {
    const db = await getDb();
    await db.runAsync('DELETE FROM section_progress WHERE module_id = ? AND section_index = ?', [
      moduleId,
      sectionIndex,
    ]);
  },

  async setModule(opts: {
    moduleId: string;
    progress: number;
    completed?: boolean;
    lastAccessed?: string;
  }) {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO module_progress (module_id, progress, completed, last_accessed, client_updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(module_id) DO UPDATE SET
         progress = excluded.progress,
         completed = excluded.completed,
         last_accessed = excluded.last_accessed,
         client_updated_at = excluded.client_updated_at`,
      [opts.moduleId, opts.progress, opts.completed ? 1 : 0, opts.lastAccessed ?? now, now],
    );
  },

  async logActivity(durationSeconds: number, pagePath: string | null) {
    if (durationSeconds <= 0) return;
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO activity_log (session_start, duration_seconds, page_path, synced) VALUES (?, ?, ?, 0)`,
      [new Date().toISOString(), durationSeconds, pagePath],
    );
  },

  async module(moduleId: string) {
    const db = await getDb();
    return db.getFirstAsync<{
      module_id: string;
      progress: number;
      completed: number;
      last_accessed: string | null;
    }>('SELECT * FROM module_progress WHERE module_id = ?', [moduleId]);
  },

  async allModules() {
    const db = await getDb();
    return db.getAllAsync<{
      module_id: string;
      progress: number;
      completed: number;
      last_accessed: string | null;
    }>('SELECT * FROM module_progress ORDER BY last_accessed DESC');
  },

  async sections(moduleId?: string) {
    const db = await getDb();
    if (moduleId) {
      return db.getAllAsync<{ module_id: string; section_index: number; completed_at: string }>(
        'SELECT * FROM section_progress WHERE module_id = ?',
        [moduleId],
      );
    }
    return db.getAllAsync<{ module_id: string; section_index: number; completed_at: string }>(
      'SELECT * FROM section_progress',
    );
  },

  async unsyncedCount() {
    const db = await getDb();
    const modules = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM module_progress');
    const sections = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM section_progress');
    const activity = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM activity_log WHERE synced = 0');
    const cards = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM flashcard_progress WHERE synced = 0');
    const quiz = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM quiz_answers WHERE synced = 0');
    return (modules?.n ?? 0) + (sections?.n ?? 0) + (activity?.n ?? 0) + (cards?.n ?? 0) + (quiz?.n ?? 0);
  },

  async saveFlashcard(row: {
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
  }) {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO flashcard_progress
        (card_id, pack_id, interval_days, repetitions, ease_factor, next_review, last_quality, times_viewed, times_correct, mastery, client_updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        row.card_id,
        row.pack_id,
        row.interval_days,
        row.repetitions,
        row.ease_factor,
        row.next_review,
        row.last_quality,
        row.times_viewed,
        row.times_correct,
        row.mastery,
        new Date().toISOString(),
      ],
    );
  },

  async flashcardsForPack(packId: string) {
    const db = await getDb();
    return db.getAllAsync<{
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
    }>('SELECT * FROM flashcard_progress WHERE pack_id = ?', [packId]);
  },

  async saveQuizAnswer(questionId: string, selected: string, correct: boolean) {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO quiz_answers (question_id, selected_answer, correct, client_updated_at, synced)
       VALUES (?, ?, ?, ?, 0)`,
      [questionId, selected, correct ? 1 : 0, new Date().toISOString()],
    );
  },

  async quizAnswer(questionId: string) {
    const db = await getDb();
    return db.getFirstAsync<{ selected_answer: string; correct: number }>(
      'SELECT selected_answer, correct FROM quiz_answers WHERE question_id = ?',
      [questionId],
    );
  },

  async weekActivity() {
    const db = await getDb();
    return db.getAllAsync<{ session_start: string; duration_seconds: number }>(
      'SELECT session_start, duration_seconds FROM activity_log ORDER BY session_start DESC LIMIT 200',
    );
  },

  async unsyncedActivity() {
    const db = await getDb();
    return db.getAllAsync<{ session_start: string; duration_seconds: number }>(
      'SELECT session_start, duration_seconds FROM activity_log WHERE synced = 0 ORDER BY session_start DESC LIMIT 200',
    );
  },
};
