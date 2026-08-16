import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  try {
    dbPromise ??= open();
    return await dbPromise;
  } catch (err) {
    dbPromise = null;
    throw err;
  }
}

async function open() {
  const db = await SQLite.openDatabaseAsync('cadetmate-offline.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS installed_content (
      kind TEXT NOT NULL,
      id TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      version INTEGER NOT NULL,
      bytes INTEGER NOT NULL,
      is_premium INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT NOT NULL,
      PRIMARY KEY (kind, id)
    );
    CREATE TABLE IF NOT EXISTS module_progress (
      module_id TEXT PRIMARY KEY NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      last_accessed TEXT,
      client_updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS section_progress (
      module_id TEXT NOT NULL,
      section_index INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      PRIMARY KEY (module_id, section_index)
    );
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_start TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      page_path TEXT,
      synced INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS flashcard_progress (
      card_id TEXT PRIMARY KEY NOT NULL,
      pack_id TEXT NOT NULL,
      interval_days REAL NOT NULL,
      repetitions INTEGER NOT NULL,
      ease_factor REAL NOT NULL,
      next_review TEXT NOT NULL,
      last_quality INTEGER,
      times_viewed INTEGER NOT NULL,
      times_correct INTEGER NOT NULL,
      mastery REAL NOT NULL,
      client_updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS quiz_answers (
      question_id TEXT PRIMARY KEY NOT NULL,
      selected_answer TEXT NOT NULL,
      correct INTEGER NOT NULL,
      client_updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );
  `);
  return db;
}

export async function kvGet(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function kvSet(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', [key, value]);
}
