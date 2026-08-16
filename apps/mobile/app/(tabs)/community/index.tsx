import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { ErrorText, Field, LoadingScreen, OfflineUnavailable, OutlineButton, Screen } from '../../../components/ui';
import { useOffline } from '../../../lib/offline';
import { colors, fonts, radius, shadow, space, type } from '../../../theme';

type PostRow = {
  id: string;
  title: string;
  body: string;
  vote_score: number;
  comment_count: number;
  created_at: string;
  author?: { full_name?: string | null } | { full_name?: string | null }[] | null;
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function CommunityScreen() {
  const router = useRouter();
  const { canUseNetwork } = useOffline();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canUseNetwork) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('posts')
      .select('id, title, body, vote_score, comment_count, created_at, author:profiles!posts_user_id_fkey(full_name)')
      .eq('is_deleted', false)
      .eq('status', 'published')
      .order('hot_score', { ascending: false })
      .limit(40);
    if (err) setError(err.message);
    else setPosts((data ?? []) as PostRow[]);
    setLoading(false);
  }, [canUseNetwork]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => `${p.title} ${p.body}`.toLowerCase().includes(q));
  }, [posts, query]);

  if (!canUseNetwork) {
    return (
      <Screen safeTop>
        <Text style={type.h1}>Community</Text>
        <OfflineUnavailable feature="Community" />
      </Screen>
    );
  }

  if (loading) return <LoadingScreen />;

  const authorName = (row: PostRow) => {
    const a = Array.isArray(row.author) ? row.author[0] : row.author;
    return a?.full_name || 'Cadet';
  };

  return (
    <Screen style={{ padding: 0 }} safeTop>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            <Text style={type.h1}>Community</Text>
            <Text style={[type.muted, { marginBottom: 12 }]}>Questions, tips and cadet chat.</Text>
            <Field placeholder="Search posts" value={query} onChangeText={setQuery} style={{ marginBottom: 12 }} />
            <OutlineButton label="New post" onPress={() => router.push('/community/compose')} />
            {error ? <ErrorText>{error}</ErrorText> : null}
          </>
        }
        ListEmptyComponent={<Text style={[type.muted, { textAlign: 'center', marginTop: 32 }]}>Nothing here yet.</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/community/${item.id}`)}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                gap: 12,
                padding: space.lg,
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: pressed ? 'rgba(41,102,242,0.25)' : colors.border,
                ...shadow.card,
              },
            ]}
          >
            <View style={{ alignItems: 'center', width: 36, backgroundColor: '#F0F1F4', borderRadius: radius.md, paddingVertical: 8 }}>
              <ChevronUp size={16} color="#F97316" strokeWidth={2} />
              <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.text, marginVertical: 2 }}>
                {item.vote_score}
              </Text>
              <ChevronDown size={16} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={type.caption}>
                {authorName(item)} · {timeAgo(item.created_at)}
              </Text>
              <Text style={[type.h3, { marginTop: 4 }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[type.muted, { marginTop: 4 }]} numberOfLines={3}>
                {item.body}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <MessageSquare size={14} color={colors.textMuted} strokeWidth={1.75} />
                <Text style={type.caption}>
                  {item.comment_count} {item.comment_count === 1 ? 'comment' : 'comments'}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        refreshing={loading}
        onRefresh={load}
      />
    </Screen>
  );
}
