import { useCallback, useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/AuthContext';
import { ListRow, LoadingScreen, OfflineUnavailable, OutlineButton, Screen } from '../../../components/ui';
import { useOffline } from '../../../lib/offline';
import { type } from '../../../theme';

type Note = {
  id: string;
  title?: string | null;
  body?: string | null;
  message?: string | null;
  read_at?: string | null;
  created_at: string;
};

export default function NotificationsScreen() {
  const { session } = useAuth();
  const { canUseNetwork } = useOffline();
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.user.id || !canUseNetwork) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setItems((data ?? []) as Note[]);
    setLoading(false);
  }, [session?.user.id, canUseNetwork]);

  useEffect(() => {
    void load();
  }, [load]);

  const markAll = async () => {
    if (!session?.user.id) return;
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', session.user.id)
      .is('read_at', null);
    await load();
  };

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!canUseNetwork) {
    return (
      <Screen>
        <OfflineUnavailable feature="Notifications" />
      </Screen>
    );
  }
  if (loading) return <LoadingScreen />;

  return (
    <Screen scroll>
      <OutlineButton label="Mark all read" onPress={markAll} />
      {items.length === 0 ? (
        <ListRow title="No notifications yet" subtitle="Activity on your account will show up here." icon={Bell} />
      ) : (
        items.map((n) => (
          <ListRow
            key={n.id}
            icon={Bell}
            title={n.title || 'Notification'}
            subtitle={n.body || n.message}
            meta={new Date(n.created_at).toLocaleString()}
          />
        ))
      )}
    </Screen>
  );
}
