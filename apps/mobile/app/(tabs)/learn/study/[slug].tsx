import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  applyForgettingCurve,
  initProgress,
  pickNext,
  sm2,
  type CardProgress,
  type Flashcard,
  type FlashcardPack,
  type SessionCardState,
} from '@cadet-mate/shared';
import { useAuth } from '../../../../lib/AuthContext';
import { href } from '../../../../lib/href';
import { LoadingScreen, OutlineButton, Screen } from '../../../../components/ui';
import { loadLocalContent, ProgressStore, resolveMediaUri } from '../../../../lib/offline';
import { colors, fonts, radius, shadow, space, type } from '../../../../theme';

type PackPayload = { pack: FlashcardPack; cards?: Flashcard[] };

export default function StudyScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user.id;

  const [pack, setPack] = useState<FlashcardPack | null>(null);
  const [states, setStates] = useState<SessionCardState[]>([]);
  const [current, setCurrent] = useState<SessionCardState | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug || !userId) {
      setError(userId ? 'Pack not found' : 'Sign in to study this pack.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const local = await loadLocalContent<PackPayload>('flashcard_pack', slug);
    if (!local?.pack) {
      setError('This pack is not on this device. Download it from Manage offline content.');
      setPack(null);
      setLoading(false);
      return;
    }

    const p = local.pack;
    const cards = (local.cards ?? []).map((card, i) => ({
      ...card,
      id: String(card.id ?? `${p.id}:${i}`),
      pack_id: p.id,
    }));
    setPack(p);

    const progressRows = await ProgressStore.flashcardsForPack(p.id);
    const byCard = new Map(progressRows.map((row) => [row.card_id, row]));
    const nextStates: SessionCardState[] = cards.map((card) => {
      const existing = byCard.get(card.id);
      const progress: CardProgress = existing
        ? applyForgettingCurve({
            user_id: userId,
            card_id: existing.card_id,
            pack_id: existing.pack_id,
            interval_days: existing.interval_days,
            repetitions: existing.repetitions,
            ease_factor: existing.ease_factor,
            next_review: existing.next_review,
            last_quality: existing.last_quality,
            times_viewed: existing.times_viewed,
            times_correct: existing.times_correct,
            mastery: existing.mastery,
          })
        : initProgress(card, userId);
      return { card, progress };
    });

    setStates(nextStates);
    setCurrent(pickNext(nextStates, 'smart_review'));
    setFlipped(false);
    setLoading(false);
  }, [slug, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const remaining = useMemo(() => states.length, [states]);

  const rate = async (quality: number) => {
    if (!current || !userId) return;
    const updated = sm2(current.progress, quality);
    await ProgressStore.saveFlashcard({
      card_id: updated.card_id,
      pack_id: updated.pack_id,
      interval_days: updated.interval_days,
      repetitions: updated.repetitions,
      ease_factor: updated.ease_factor,
      next_review: updated.next_review,
      last_quality: updated.last_quality,
      times_viewed: updated.times_viewed,
      times_correct: updated.times_correct,
      mastery: updated.mastery,
    });

    const nextStates = states.map((s) =>
      s.card.id === current.card.id ? { ...s, progress: updated } : s,
    );
    setStates(nextStates);
    setCurrent(pickNext(nextStates, 'smart_review', current.card.id));
    setFlipped(false);
  };

  if (loading) return <LoadingScreen />;
  if (error || !pack || !current) {
    return (
      <Screen>
        <Text style={type.muted}>{error ?? 'No cards in this pack.'}</Text>
        {error?.includes('not on this device') ? (
          <OutlineButton label="Manage offline content" onPress={() => router.push(href('/profile/offline-content'))} />
        ) : null}
      </Screen>
    );
  }

  const imageUri = flipped ? resolveMediaUri(current.card.image_url) : null;

  return (
    <Screen>
      <Text style={type.h2}>{pack.title}</Text>
      <Text style={type.muted}>{remaining} cards in session</Text>

      <Pressable
        onPress={() => setFlipped((f) => !f)}
        style={{
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          padding: 20,
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          ...shadow.card,
        }}
      >
        <Text style={type.label}>{flipped ? 'Answer' : 'Question'}</Text>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: 160, borderRadius: 12, marginTop: 12, backgroundColor: colors.parchment }}
            resizeMode="contain"
          />
        ) : null}
        <Text style={[type.h2, { marginTop: 12, lineHeight: 30 }]}>
          {flipped ? current.card.back : current.card.front}
        </Text>
        <Text style={[type.caption, { marginTop: 24, textAlign: 'center' }]}>Tap to flip</Text>
      </Pressable>

      {flipped ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: space.md }}>
          {[
            { label: 'Again', q: 1, bg: colors.danger },
            { label: 'Hard', q: 3, bg: colors.warning },
            { label: 'Good', q: 4, bg: colors.success },
            { label: 'Easy', q: 5, bg: colors.primary },
          ].map((btn) => (
            <Pressable
              key={btn.label}
              onPress={() => void rate(btn.q)}
              style={{
                flex: 1,
                borderRadius: 12,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: btn.bg,
              }}
            >
              <Text style={{ color: '#fff', fontFamily: fonts.semibold, fontSize: 13 }}>{btn.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
