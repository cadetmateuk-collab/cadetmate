import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ClipboardList } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/AuthContext';
import { href } from '../../../lib/href';
import { ErrorText, Field, ListRow, LoadingScreen, PremiumLock, Screen } from '../../../components/ui';
import { loadLocalContent, withNetworkFallback } from '../../../lib/offline';
import { type } from '../../../theme';

type TrbTask = {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
};

export default function TrbListScreen() {
  const router = useRouter();
  const { isPremium } = useAuth();
  const [tasks, setTasks] = useState<TrbTask[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await withNetworkFallback(
        async () => {
          const local = await loadLocalContent<{ tasks: TrbTask[] }>('trb', 'trb_tasks');
          return local?.tasks ?? [];
        },
        async () => {
          const { data, error: err } = await supabase
            .from('trb_tasks')
            .select('id, code, title, category, description')
            .order('code');
          if (err) throw new Error(err.message);
          return (data ?? []) as TrbTask[];
        },
      );
      setTasks(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load TRB');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => `${t.code} ${t.title} ${t.category} ${t.description}`.toLowerCase().includes(q));
  }, [tasks, query]);

  if (loading) return <LoadingScreen />;
  if (!isPremium) {
    return (
      <Screen safeTop>
        <PremiumLock message="TRB tasks are included with Premium." onExplore={() => router.push(href('/profile/store'))} />
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }} safeTop>
      <Text style={[type.h1, { marginHorizontal: 16, marginTop: 8 }]}>TRB</Text>
      <Field
        value={query}
        onChangeText={setQuery}
        placeholder="Search tasks"
        style={{ margin: 16, marginBottom: 8 }}
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}
        renderItem={({ item }) => (
          <ListRow
            icon={ClipboardList}
            title={`${item.code} · ${item.title}`}
            subtitle={item.category}
            onPress={() => router.push(`/trb/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <Text style={type.muted}>
            {tasks.length === 0
              ? 'No TRB tasks on this device. Allow connectivity and download them from Going online.'
              : 'No tasks match that search.'}
          </Text>
        }
      />
    </Screen>
  );
}
