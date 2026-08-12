export type CardType = 'standard' | 'image' | 'reverse' | 'multiple_choice';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type PackStatus = 'draft' | 'published' | 'archived';

export interface FlashcardPack {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: Difficulty;
  thumbnail_url?: string | null;
  storage_path?: string | null;
  is_premium: boolean;
  price_cents: number;
  stripe_price_id?: string | null;
  status: PackStatus;
  card_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface Flashcard {
  id: string;
  pack_id: string;
  position: number;
  card_type: CardType;
  front: string;
  back: string;
  hint?: string | null;
  image_url?: string | null;
  options?: { choices: string[]; correctIndex: number } | null;
  tags: string[];
  difficulty: Difficulty;
}

export interface CardProgress {
  user_id: string;
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
}

export interface PackStats {
  user_id: string;
  pack_id: string;
  cards_seen: number;
  cards_mastered: number;
  accuracy: number;
  time_spent_sec: number;
  reviews_completed: number;
  last_studied_at?: string | null;
}

export interface UserXP {
  user_id: string;
  xp: number;
  rank: string;
  current_streak: number;
  longest_streak: number;
  last_study_day?: string | null;
  total_time_sec: number;
}

export type StudyMode =
  | 'standard'
  | 'smart_review'
  | 'exam_cram'
  | 'match'
  | 'quick_fire'
  | 'survival';

export interface SessionCardState {
  card: Flashcard;
  progress: CardProgress;
}

export type UserRole = 'free' | 'basic' | 'premium' | 'content' | 'admin';
