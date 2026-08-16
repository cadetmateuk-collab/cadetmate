import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, CloudOff, CreditCard, Download, KeyRound } from 'lucide-react-native';
import { useAuth } from '../../../lib/AuthContext';
import { connectHref, href } from '../../../lib/href';
import { Badge, Card, ErrorText, HubTile, Screen } from '../../../components/ui';
import { useOffline, formatBytes, formatWhen } from '../../../lib/offline';
import { webApi } from '../../../lib/api';
import { openExternal, webPath } from '../../../lib/openWeb';
import { colors, type } from '../../../theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { session, profile, isPremium } = useAuth();
  const offline = useOffline();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    if (!offline.canUseNetwork) {
      setError('Turn connectivity on to manage billing on the website.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await webApi<{ url?: string }>('/api/billing-portal', { method: 'POST' });
      if (data.url) await openExternal(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing');
    }
    setBusy(false);
  };

  const pending = offline.lastCheck?.updates.length ?? 0;
  const pendingBytes = offline.lastCheck?.totalDownloadBytes ?? 0;

  return (
    <Screen scroll>
      <Text style={type.h1}>Settings</Text>
      <Card>
        <Text style={type.caption}>Account</Text>
        <Text style={[type.h3, { marginTop: 4 }]}>{profile?.full_name || 'Cadet'}</Text>
        <Text style={type.muted}>{session?.user.email}</Text>
        <Badge label={isPremium ? 'Premium' : 'Free'} tone={isPremium ? 'brass' : 'default'} />
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <CloudOff size={18} color={colors.text} strokeWidth={1.75} />
          <Text style={type.h3}>Connectivity</Text>
        </View>
        <Text style={[type.muted, { marginTop: 8 }]}>
          Offline Mode stops every network request, even if Wi-Fi or ship internet is available. You will be
          asked to download remaining content before it turns on.
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <Text style={type.body}>Offline Mode</Text>
          <Switch
            value={offline.offlineMode}
            onValueChange={(on) => {
              if (on === offline.offlineMode) return;
              router.push(connectHref(on ? 'offline' : 'online'));
            }}
          />
        </View>
        <Text style={[type.caption, { marginTop: 12 }]}>Last connection: {formatWhen(offline.lastConnectedAt)}</Text>
        <Text style={type.caption}>
          Offline access valid until: {offline.licenceUntil ? formatWhen(offline.licenceUntil) : 'Not issued yet'}
        </Text>
        <Text style={type.caption}>Downloaded content: {offline.downloadedCount} packages</Text>
        <Text style={type.caption}>
          Pending updates: {pending}
          {pending ? ` · ${formatBytes(pendingBytes, Boolean(offline.lastCheck?.updates.some((u) => u.bytesEstimated)))}` : ''}
        </Text>
        {offline.deviceHasInternet && offline.offlineMode ? (
          <Text style={[type.caption, { marginTop: 8, color: colors.warning }]}>
            This device has internet, but the app is not using it.
          </Text>
        ) : null}
      </Card>

      <HubTile
        title="Manage offline content"
        subtitle="See downloaded courses and review updates"
        icon={Download}
        onPress={() => router.push(href('/profile/offline-content'))}
      />

      {isPremium ? (
        <HubTile
          title="Manage billing"
          subtitle="Opens the website billing portal"
          icon={CreditCard}
          onPress={openPortal}
        />
      ) : (
        <HubTile
          title="Premium on the website"
          subtitle="Subscriptions are managed at cadetmate.co.uk"
          icon={CreditCard}
          onPress={() => void openExternal(webPath('/store'))}
        />
      )}
      <HubTile title="Notifications" subtitle="Activity on your account" icon={Bell} onPress={() => router.push(href('/profile/notifications'))} />
      <HubTile title="Reset password" subtitle="Email a reset link" icon={KeyRound} onPress={() => router.push('/(auth)/reset')} />
      {busy ? <Text style={type.caption}>Opening billing…</Text> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </Screen>
  );
}
