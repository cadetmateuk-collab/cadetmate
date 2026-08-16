import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Newspaper, Search } from 'lucide-react-native';
import { supabase } from '../../../../lib/supabase';
import { articleHref } from '../../../../lib/href';
import { ErrorText, Field, LoadingScreen, Screen } from '../../../../components/ui';
import { loadInstalledPayloads, resolveMediaUri, withNetworkFallback } from '../../../../lib/offline';
import { colors, fonts, radius, shadow } from '../../../../theme';

type Post = {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  category: string | null;
  date: string | null;
  image: string | null;
  read_time: string | null;
  hidden?: boolean | null;
};

function usableCover(url: string | null | undefined) {
  return resolveMediaUri(url);
}

function formatDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ArticlesScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await withNetworkFallback(
        () => loadInstalledPayloads<Post>('article'),
        async () => {
          const { data, error: err } = await supabase
            .from('blog_posts')
            .select('id, title, excerpt, slug, category, date, image, read_time, hidden')
            .or('hidden.eq.false,hidden.is.null')
            .order('date', { ascending: false });
          if (err) throw new Error(err.message);
          return (data ?? []) as Post[];
        },
      );
      setPosts(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load articles');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const post of posts) {
      if (post.category) set.add(post.category);
    }
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [posts]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((post) => {
      if (post.hidden) return false;
      const hay = `${post.title} ${post.excerpt ?? ''} ${post.category ?? ''}`.toLowerCase();
      const matchesSearch = !q || hay.includes(q);
      const matchesTag = tag === 'All' || post.category === tag;
      return matchesSearch && matchesTag;
    });
  }, [posts, search, tag]);

  if (loading) return <LoadingScreen />;

  return (
    <Screen style={{ padding: 0 }}>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 24 }}
        onRefresh={load}
        refreshing={loading}
        ListHeaderComponent={
          <View style={{ gap: 10, marginBottom: 4 }}>
            <View style={styles.searchWrap}>
              <View style={styles.searchIcon}>
                <Search size={16} color={colors.textMuted} strokeWidth={2} />
              </View>
              <Field
                placeholder="Search articles…"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.searchField}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {tags.map((item) => {
                const active = tag === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setTag(item)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => {
          const cover = usableCover(item.image);
          return (
            <Pressable
              onPress={() => router.push(articleHref(item.slug))}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.88 }]}
            >
              {cover ? (
                <Image source={{ uri: cover }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <Newspaper size={20} color={colors.primary} strokeWidth={1.75} />
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.excerpt ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {item.excerpt}
                  </Text>
                ) : null}
                <Text style={styles.meta} numberOfLines={1}>
                  {[item.category, formatDate(item.date), item.read_time].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.75} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {posts.length === 0
              ? 'No articles on this device yet. Allow connectivity and download them from Manage offline content.'
              : 'No articles match that search or tag.'}
          </Text>
        }
      />
    </Screen>
  );
}

const styles = {
  searchWrap: {
    position: 'relative' as const,
    justifyContent: 'center' as const,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: 12,
    zIndex: 1,
    height: 42,
    justifyContent: 'center' as const,
  },
  searchField: {
    paddingLeft: 36,
    fontSize: 14,
    minHeight: 42,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  chipText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(232,230,224,0.6)',
    ...shadow.card,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#E8EEF9',
  },
  thumbFallback: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center' as const,
    marginTop: 24,
  },
};
