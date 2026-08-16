import { useCallback, useEffect, useState } from 'react';
import { Image, Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { href } from '../../../../lib/href';
import { LoadingScreen, OutlineButton, Screen } from '../../../../components/ui';
import { stripHtml } from '../../../../lib/html';
import { loadLocalContent, resolveMediaUri, useOffline } from '../../../../lib/offline';
import { supabase } from '../../../../lib/supabase';
import { colors, type } from '../../../../theme';

type Post = {
  title: string;
  content: string | null;
  excerpt: string | null;
  category: string | null;
  image: string | null;
  date: string | null;
  read_time: string | null;
};

export default function ArticleDetailScreen() {
  const raw = useLocalSearchParams<{ slug: string | string[] }>();
  const slug = Array.isArray(raw.slug) ? raw.slug[0] : raw.slug;
  const router = useRouter();
  const { ready, canUseNetwork } = useOffline();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!slug) {
      setPost(null);
      setLoading(false);
      return;
    }
    const local = await loadLocalContent<Post>('article', slug);
    if (!canUseNetwork) {
      setPost(local);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('title, content, excerpt, category, image, date, read_time')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      setPost((data as Post | null) ?? local);
    } catch {
      setPost(local);
    }
    setLoading(false);
  }, [slug, canUseNetwork]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  if (loading || !ready) return <LoadingScreen />;
  if (!post) {
    return (
      <Screen>
        <Text style={type.muted}>
          This article is not on this device. Allow connectivity and download it from Manage offline content.
        </Text>
        <OutlineButton
          label="Manage offline content"
          onPress={() => router.push(href('/profile/offline-content'))}
        />
        <OutlineButton label="Back" onPress={() => router.back()} />
      </Screen>
    );
  }

  const image = resolveMediaUri(post.image);

  return (
    <>
      <Stack.Screen options={{ title: post.title }} />
      <Screen scroll>
        {image ? (
          <Image
            source={{ uri: image }}
            style={{ width: '100%', height: 180, borderRadius: 12, backgroundColor: colors.bgElevated }}
            resizeMode="cover"
          />
        ) : null}
        <Text style={type.caption}>
          {[post.category, post.read_time].filter(Boolean).join(' · ')}
        </Text>
        <Text style={type.h2}>{post.title}</Text>
        <Text style={type.body}>{stripHtml(post.content || post.excerpt || '')}</Text>
      </Screen>
    </>
  );
}
