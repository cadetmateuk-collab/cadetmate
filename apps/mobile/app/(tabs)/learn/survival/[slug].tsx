import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { href } from '../../../../lib/href';
import { LoadingScreen, OutlineButton, Screen } from '../../../../components/ui';
import { stripHtml } from '../../../../lib/html';
import { loadLocalContent } from '../../../../lib/offline';
import { type } from '../../../../theme';

export default function SurvivalArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<{ title: string; category: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const local = slug ? await loadLocalContent<typeof article>('survival', slug) : null;
    setArticle(local);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingScreen />;
  if (!article) {
    return (
      <Screen>
        <Text style={type.muted}>
          This article is not on this device. Download it from Manage offline content.
        </Text>
        <OutlineButton label="Manage offline content" onPress={() => router.push(href('/profile/offline-content'))} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text style={type.caption}>{article.category}</Text>
      <Text style={type.h2}>{article.title}</Text>
      <Text style={type.body}>{stripHtml(article.content || '')}</Text>
    </Screen>
  );
}
