import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  applyForgettingCurve,
  initProgress,
  pickNext,
  sm2,
  type Flashcard,
  type FlashcardPack,
  type SessionCardState,
} from '@cadet-mate/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

export default function StudyScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [pack, setPack] = useState<FlashcardPack | null>(null);
  const [states, setStates] = useState<SessionCardState[]>([]);
  const [current, setCurrent] = useState<SessionCardState | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug || !userId) return;
    setLoading(true);
    setError(null);

    const { data: p, error: pe } = await supabase
      .from('flashcard_packs')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (pe || !p) {
      setError(pe?.message ?? 'Pack not found');
      setLoading(false);
      return;
    }
    setPack(p as FlashcardPack);

    let cards: Flashcard[] = [];
    if (p.storage_path) {
      const { data: file } = await supabase.storage.from('flashcards').download(p.storage_path);
      if (file) {
        const json = JSON.parse(await file.text());
        cards = (json.cards ?? []).map((c: Record<string, unknown>, i: number): Flashcard => ({
          id: String(c.id ?? `${p.id}:${i}`),
          pack_id: p.id,
          position: Number(c.position ?? i),
          card_type: (c.card_type as Flashcard['card_type']) ?? 'standard',
          front: String(c.front ?? ''),
          back: String(c.back ?? ''),
          hint: (c.hint as string | null) ?? null,
          image_url: (c.image_url as string | null) ?? null,
          options: (c.options as Flashcard['options']) ?? null,
          tags: (c.tags as string[]) ?? [],
          difficulty: (c.difficulty as Flashcard['difficulty']) ?? 'beginner',
        }));
      }
    } else {
      const { data: rows } = await supabase
        .from('flashcards')
        .select('*')
        .eq('pack_id', p.id)
        .order('position');
      cards = (rows ?? []) as Flashcard[];
    }

    const { data: progressRows } = await supabase
      .from('flashcard_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('pack_id', p.id);

    const byCard = new Map((progressRows ?? []).map((row) => [row.card_id, row]));
    const nextStates: SessionCardState[] = cards.map((card) => {
      const existing = byCard.get(card.id);
      const progress = existing
        ? applyForgettingCurve(existing as SessionCardState['progress'])
        : initProgress(card, userId);
      return { card, progress };
    });

    setStates(nextStates);
    setCurrent(pickNext(nextStates, 'smart_review'));
    setFlipped(false);
    setLoading(false);
  }, [slug, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const remaining = useMemo(() => states.length, [states]);

  const rate = async (quality: number) => {
    if (!current || !userId) return;
    const updated = sm2(current.progress, quality);
    await supabase.from('flashcard_progress').upsert(updated);

    const nextStates = states.map((s) =>
      s.card.id === current.card.id ? { ...s, progress: updated } : s,
    );
    setStates(nextStates);
    setCurrent(pickNext(nextStates, 'smart_review', current.card.id));
    setFlipped(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#5B8CFF" />
      </View>
    );
  }

  if (error || !pack || !current) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'No cards in this pack.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.packTitle}>{pack.title}</Text>
      <Text style={styles.meta}>{remaining} cards in session</Text>

      <Pressable style={styles.card} onPress={() => setFlipped((f) => !f)}>
        <Text style={styles.sideLabel}>{flipped ? 'Answer' : 'Question'}</Text>
        <Text style={styles.cardText}>{flipped ? current.card.back : current.card.front}</Text>
        <Text style={styles.hint}>Tap to flip</Text>
      </Pressable>

      {flipped ? (
        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.again]} onPress={() => rate(1)}>
            <Text style={styles.btnText}>Again</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.hard]} onPress={() => rate(3)}>
            <Text style={styles.btnText}>Hard</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.good]} onPress={() => rate(4)}>
            <Text style={styles.btnText}>Good</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.easy]} onPress={() => rate(5)}>
            <Text style={styles.btnText}>Easy</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1F3A', padding: 16 },
  center: {
    flex: 1,
    backgroundColor: '#0B1F3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packTitle: { color: '#E8EEF7', fontSize: 20, fontWeight: '700' },
  meta: { color: '#8AA0C0', marginBottom: 16 },
  card: {
    flex: 1,
    backgroundColor: '#132A4A',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
  },
  sideLabel: { color: '#8AA0C0', marginBottom: 12, textTransform: 'uppercase', fontSize: 12 },
  cardText: { color: '#E8EEF7', fontSize: 22, lineHeight: 30 },
  hint: { color: '#8AA0C0', marginTop: 24, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  again: { backgroundColor: '#8B2E2E' },
  hard: { backgroundColor: '#8B5E2E' },
  good: { backgroundColor: '#2E6B4E' },
  easy: { backgroundColor: '#2F6BFF' },
  btnText: { color: '#fff', fontWeight: '600' },
  error: { color: '#FF8A8A' },
});
