import { useCallback, useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import type { Flashcard, FlashcardPack } from '@cadet-mate/shared';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../lib/AuthContext';
import { href } from '../../../../lib/href';
import { ErrorText, ListRow, LoadingScreen, Screen } from '../../../../components/ui';
import { formatGbp } from '../../../../lib/html';
import { loadInstalledPayloads, withNetworkFallback } from '../../../../lib/offline';
import { Layers } from 'lucide-react-native';

type PackPayload = { pack: FlashcardPack; cards?: Flashcard[] };

export default function FlashcardsLibraryScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [packs, setPacks] = useState<FlashcardPack[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const local = await loadInstalledPayloads<PackPayload>('flashcard_pack');
      const localOwned = new Set(local.map((item) => item.pack.id));
      const rows = await withNetworkFallback(
        async () => {
          setOwned(localOwned);
          return local.map((item) => item.pack);
        },
        async () => {
          const [{ data, error: err }, owns] = await Promise.all([
            supabase
              .from('flashcard_packs')
              .select('*')
              .eq('status', 'published')
              .order('updated_at', { ascending: false }),
            session?.user.id
              ? supabase.from('flashcard_pack_ownership').select('pack_id').eq('user_id', session.user.id)
              : Promise.resolve({ data: [] as { pack_id: string }[] }),
          ]);
          if (err) throw new Error(err.message);
          setOwned(new Set([...(owns.data ?? []).map((row) => row.pack_id), ...localOwned]));
          return (data ?? []) as FlashcardPack[];
        },
      );
      setPacks(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load flashcards');
    }
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingScreen />;

  return (
    <Screen style={{ padding: 0 }}>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <FlatList
        data={packs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        onRefresh={load}
        refreshing={loading}
        renderItem={({ item }) => {
          const hasAccess = owned.has(item.id) || !item.price_cents;
          return (
            <ListRow
              icon={Layers}
              title={item.title}
              subtitle={item.description}
              meta={`${item.card_count} cards · ${item.price_cents ? formatGbp(item.price_cents) : 'Free'} · ${item.category}`}
              onPress={() =>
                router.push(href(hasAccess ? `/learn/study/${item.slug}` : `/profile/store/${item.slug}`))
              }
            />
          );
        }}
      />
    </Screen>
  );
}
