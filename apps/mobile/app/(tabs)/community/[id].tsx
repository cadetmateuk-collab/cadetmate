import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/AuthContext';
import { Card, ErrorText, Field, LoadingScreen, OfflineUnavailable, PrimaryButton, Screen } from '../../../components/ui';
import { useOffline } from '../../../lib/offline';
import { colors, fonts, radius, type } from '../../../theme';

type Comment = {
  id: string;
  body: string;
  vote_score: number;
  author?: { full_name?: string | null } | { full_name?: string | null }[] | null;
};

export default function CommunityPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { canUseNetwork } = useOffline();
  const [post, setPost] = useState<{ title: string; body: string; vote_score: number } | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canUseNetwork) {
      setLoading(false);
      return;
    }
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('posts').select('title, body, vote_score').eq('id', id).maybeSingle(),
      supabase
        .from('comments')
        .select('id, body, vote_score, author:profiles!comments_user_id_fkey(full_name)')
        .eq('post_id', id)
        .eq('is_deleted', false)
        .eq('status', 'published')
        .order('created_at'),
    ]);
    setPost(p);
    setComments((c ?? []) as Comment[]);
    setLoading(false);
  }, [id, canUseNetwork]);

  useEffect(() => {
    void load();
  }, [load]);

  const vote = async (value: 1 | -1) => {
    if (!session?.user.id) return;
    await supabase.from('votes').upsert(
      {
        user_id: session.user.id,
        target_type: 'post',
        target_id: id,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,target_type,target_id' },
    );
    await load();
  };

  const comment = async () => {
    if (!session?.user.id || !draft.trim()) return;
    setError(null);
    const { error: err } = await supabase.from('comments').insert({
      post_id: id,
      user_id: session.user.id,
      body: draft.trim(),
      parent_id: null,
      depth: 0,
      status: 'published',
    });
    if (err) setError(err.message);
    else {
      setDraft('');
      await load();
    }
  };

  if (!canUseNetwork) {
    return (
      <Screen>
        <OfflineUnavailable feature="Community" />
      </Screen>
    );
  }

  if (loading) return <LoadingScreen />;
  if (!post) {
    return (
      <Screen>
        <Text style={type.muted}>Post not found.</Text>
      </Screen>
    );
  }

  const name = (row: Comment) => {
    const a = Array.isArray(row.author) ? row.author[0] : row.author;
    return a?.full_name || 'Cadet';
  };

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ alignItems: 'center', width: 40, backgroundColor: '#F0F1F4', borderRadius: radius.md, paddingVertical: 8 }}>
          <Pressable onPress={() => vote(1)}>
            <ChevronUp size={20} color="#F97316" strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginVertical: 4 }}>
            {post.vote_score}
          </Text>
          <Pressable onPress={() => vote(-1)}>
            <ChevronDown size={20} color={colors.primary} strokeWidth={2} />
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={type.h2}>{post.title}</Text>
          <Text style={[type.body, { marginTop: 8 }]}>{post.body}</Text>
        </View>
      </View>

      <Text style={type.h3}>Comments</Text>
      {comments.map((c) => (
        <Card key={c.id}>
          <Text style={type.caption}>{name(c)}</Text>
          <Text style={[type.body, { marginTop: 4 }]}>{c.body}</Text>
        </Card>
      ))}
      <Field placeholder="Write a comment" value={draft} onChangeText={setDraft} multiline style={{ minHeight: 88, textAlignVertical: 'top' }} />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <PrimaryButton label="Post comment" onPress={comment} />
    </Screen>
  );
}
