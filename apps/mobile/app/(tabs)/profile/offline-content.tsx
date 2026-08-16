import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CONTENT_KIND_LABEL } from '@cadet-mate/shared';
import { Card, OutlineButton, PrimaryButton, Screen } from '../../../components/ui';
import { CourseStore, formatBytes, useOffline } from '../../../lib/offline';
import { connectHref } from '../../../lib/href';
import { colors, type } from '../../../theme';

type Row = Awaited<ReturnType<typeof CourseStore.list>>[number];

export default function OfflineContentScreen() {
  const router = useRouter();
  const offline = useOffline();
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    setRows(await CourseStore.list());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen scroll>
      <Text style={type.h1}>Offline content</Text>
      <Text style={type.muted}>
        Connectivity and downloads are separate. Turning Offline Mode on never starts a download.
      </Text>
      <Card>
        <Text style={type.caption}>Connectivity</Text>
        <Text style={type.h3}>{offline.offlineMode ? 'Offline Mode ON' : 'Connectivity ON'}</Text>
        <Text style={type.muted}>
          {offline.offlineMode
            ? 'The app is not using the internet.'
            : 'The app may contact the server when you ask it to.'}
        </Text>
      </Card>
      {rows.map((row) => (
        <Card key={`${row.kind}:${row.id}`}>
          <Text style={type.h3}>{row.title}</Text>
          <Text style={type.caption}>
            {CONTENT_KIND_LABEL[row.kind]} · v{row.version} · {formatBytes(row.bytes)}
          </Text>
          <View style={{ marginTop: 8 }}>
            <OutlineButton label="Remove from device" onPress={() => void CourseStore.remove(row.kind, row.id).then(load)} />
          </View>
        </Card>
      ))}
      {!rows.length ? <Text style={type.muted}>No courses downloaded yet.</Text> : null}
      {offline.lastCheck?.updates.length ? (
        <Card style={{ borderLeftWidth: 3, borderLeftColor: colors.warning }}>
          <Text style={type.h3}>Updates available</Text>
          <Text style={type.muted}>
            {formatBytes(offline.lastCheck.totalDownloadBytes)} required
          </Text>
          <PrimaryButton
            label="Review download"
            onPress={() => router.push(connectHref('check'))}
            style={{ marginTop: 12 }}
          />
        </Card>
      ) : (
        <PrimaryButton
          label={offline.canUseNetwork ? 'Check for updates' : 'Turn connectivity on to check'}
          onPress={() => {
            if (!offline.canUseNetwork) return;
            router.push(connectHref('check'));
          }}
        />
      )}
    </Screen>
  );
}
