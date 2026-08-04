import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { FlashcardPack } from '@cadet-mate/shared';
import { supabase } from '../../lib/supabase';

export default function FlashcardsScreen() {
  const router = useRouter();
  const [packs, setPacks] = useState<FlashcardPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('flashcard_packs')
      .select('*')
      .eq('status', 'published')
      .order('updated_at', { ascending: false });
    if (err) setError(err.message);
    else setPacks((data ?? []) as FlashcardPack[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#5B8CFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={load}>
          <Text style={styles.link}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={packs}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.muted}>No published packs yet.</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push(`/study/${item.slug}`)}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.card_count} cards · {item.difficulty}
            {item.is_premium ? ' · Premium' : ''}
          </Text>
          {item.description ? (
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#0B1F3A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  list: { padding: 16, gap: 12, backgroundColor: '#0B1F3A' },
  card: {
    backgroundColor: '#132A4A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  title: { color: '#E8EEF7', fontSize: 17, fontWeight: '600' },
  meta: { color: '#8AA0C0', marginTop: 4, fontSize: 13 },
  desc: { color: '#B7C7DE', marginTop: 8, fontSize: 14 },
  muted: { color: '#8AA0C0', textAlign: 'center', marginTop: 40 },
  error: { color: '#FF8A8A' },
  link: { color: '#9CBCFF' },
});
