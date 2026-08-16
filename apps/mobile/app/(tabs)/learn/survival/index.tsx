import { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionList, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { LifeBuoy } from 'lucide-react-native';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../lib/AuthContext';
import { href } from '../../../../lib/href';
import { ListRow, LoadingScreen, PremiumLock, Screen } from '../../../../components/ui';
import { loadInstalledPayloads, withNetworkFallback } from '../../../../lib/offline';
import { colors, type } from '../../../../theme';

type Article = {
  id: string;
  title: string;
  slug: string;
  category: string;
};

export default function SurvivalListScreen() {
  const router = useRouter();
  const { isPremium } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const rows = await withNetworkFallback(
      () => loadInstalledPayloads<Article>('survival'),
      async () => {
        const { data } = await supabase
          .from('sea_survival')
          .select('id, title, slug, category')
          .eq('hidden', false)
          .order('category')
          .order('position');
        return (data ?? []) as Article[];
      },
    );
    setArticles(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sections = useMemo(() => {
    const map = new Map<string, Article[]>();
    for (const a of articles) {
      const list = map.get(a.category) ?? [];
      list.push(a);
      map.set(a.category, list);
    }
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [articles]);

  if (loading) return <LoadingScreen />;
  if (!isPremium) {
    return (
      <Screen>
        <PremiumLock message="Sea survival articles are included with Premium." onExplore={() => router.push(href('/profile/store'))} />
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderSectionHeader={({ section }) => (
          <Text style={[type.label, { marginTop: 16, marginBottom: 8, color: colors.primary }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <ListRow icon={LifeBuoy} title={item.title} onPress={() => router.push(href(`/learn/survival/${item.slug}`))} />
        )}
      />
    </Screen>
  );
}
