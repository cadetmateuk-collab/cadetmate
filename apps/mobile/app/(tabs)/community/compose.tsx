import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/AuthContext';
import { ErrorText, Field, OfflineUnavailable, PrimaryButton, Screen } from '../../../components/ui';
import { useOffline } from '../../../lib/offline';
import { type } from '../../../theme';

export default function ComposePostScreen() {
  const { session } = useAuth();
  const { canUseNetwork } = useOffline();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategory = useCallback(async () => {
    if (!canUseNetwork) return;
    const { data } = await supabase.from('post_categories').select('id').limit(1);
    setCategoryId(data?.[0]?.id ?? null);
  }, [canUseNetwork]);

  useEffect(() => {
    void loadCategory();
  }, [loadCategory]);

  const submit = async () => {
    if (!session?.user.id) return;
    if (title.trim().length < 3 || body.trim().length < 3) {
      setError('Please add a title and some text.');
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('posts')
      .insert({
        user_id: session.user.id,
        category_id: categoryId,
        title: title.trim(),
        body: body.trim(),
        status: 'published',
      })
      .select('id')
      .maybeSingle();
    setBusy(false);
    if (err) setError(err.message);
    else if (data?.id) router.replace(`/community/${data.id}`);
  };

  return (
    <Screen>
      {!canUseNetwork ? (
        <OfflineUnavailable feature="Community" />
      ) : (
        <>
      <Text style={type.h2}>New post</Text>
      <Field placeholder="Title" value={title} onChangeText={setTitle} />
      <Field
        placeholder="What's on your mind?"
        value={body}
        onChangeText={setBody}
        multiline
        style={{ minHeight: 140, textAlignVertical: 'top' }}
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <PrimaryButton label="Publish" loading={busy} onPress={submit} />
        </>
      )}
    </Screen>
  );
}
