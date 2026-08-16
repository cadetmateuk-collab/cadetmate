import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CONTENT_KIND_LABEL, type ContentKind, type ContentUpdate, type SessionCheckResponse } from '@cadet-mate/shared';
import { Card, ErrorText, OutlineButton, PrimaryButton, Screen } from '../../../components/ui';
import { CourseDownloadManager, SyncManager, formatBytes, useOffline } from '../../../lib/offline';
import { isOfflineModeError } from '../../../lib/offline/errors';
import { colors, type } from '../../../theme';

const KIND_ORDER: ContentKind[] = ['module', 'flashcard_pack', 'article', 'trb', 'quiz_bank', 'survival'];

function groupUpdates(updates: ContentUpdate[]) {
  return KIND_ORDER.map((kind) => {
    const items = updates.filter((item) => item.kind === kind);
    return {
      kind,
      items,
      bytes: items.reduce((sum, item) => sum + item.bytes, 0),
      estimated: items.some((item) => item.bytesEstimated),
      fresh: items.filter((item) => item.installedVersion == null).length,
    };
  }).filter((group) => group.items.length > 0);
}

export default function ConnectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ intent?: string | string[] }>();
  const rawIntent = Array.isArray(params.intent) ? params.intent[0] : params.intent;
  const goingOffline = rawIntent === 'offline';
  const title = goingOffline ? 'Going offline' : 'Going online';

  const offline = useOffline();
  const [phase, setPhase] = useState('Connecting…');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SessionCheckResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const { runSessionCheck, setOfflineMode } = offline;
  const groups = useMemo(() => (result ? groupUpdates(result.updates) : []), [result]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setError(null);
        setResult(null);
        setSyncNote(null);
        setPhase('Connecting…');
        await setOfflineMode(false);
        if (cancelled) return;
        setPhase('Checking licence and updates…');
        const next = await runSessionCheck();
        if (cancelled) return;
        setResult(next);
        if (next.sync.estimatedUploadBytes > 0) {
          setSyncNote(`Sync required: ${formatBytes(next.sync.estimatedUploadBytes)}`);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not connect');
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only re-run when the user taps Try again. Provider callbacks change after each check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const finishOffline = async () => {
    await setOfflineMode(true);
    router.back();
  };

  const download = async () => {
    if (!result?.updates.length) return;
    setBusy(true);
    setError(null);
    try {
      if (result.sync.estimatedUploadBytes > 0) {
        setPhase(`Syncing progress (${formatBytes(result.sync.estimatedUploadBytes)})…`);
        await SyncManager.sync();
      }
      let failed = 0;
      let firstError: string | null = null;
      for (let i = 0; i < result.updates.length; i++) {
        const item = result.updates[i];
        setPhase(`Downloading ${i + 1} of ${result.updates.length}…`);
        await new Promise((resolve) => setTimeout(resolve, 16));
        try {
          await CourseDownloadManager.download(item.kind, item.id, undefined, item.version);
        } catch (err) {
          failed += 1;
          firstError = firstError ?? (err instanceof Error ? err.message : 'Download failed');
        }
      }
      await offline.refreshMeta();
      if (failed === result.updates.length) {
        throw new Error(firstError ?? 'Download failed');
      }
      if (failed) {
        setError(`${failed} of ${result.updates.length} packages could not download. The rest are saved on this device.`);
        setBusy(false);
        return;
      }
      setPhase('Done');
      if (goingOffline) await finishOffline();
      else router.back();
    } catch (err) {
      setError(isOfflineModeError(err) ? err.message : err instanceof Error ? err.message : 'Download failed');
    }
    setBusy(false);
  };

  const skipDownloads = async () => {
    setBusy(true);
    try {
      if (result?.sync.estimatedUploadBytes) await SyncManager.sync();
    } catch {
      /* keep local progress */
    }
    if (goingOffline) await finishOffline();
    else {
      setBusy(false);
      router.back();
    }
  };

  const estimated = Boolean(result?.updates.some((item) => item.bytesEstimated));
  const checking = !result && !error;
  const alreadyOnDevice = result?.alreadyOnDevice ?? 0;
  const newCount = result?.newCount ?? result?.updates.filter((item) => item.installedVersion == null).length ?? 0;
  const updateCount = result?.updateCount ?? result?.updates.filter((item) => item.installedVersion != null).length ?? 0;
  const newBytes = result?.updates.filter((item) => item.installedVersion == null).reduce((sum, item) => sum + item.bytes, 0) ?? 0;
  const updateBytes = result?.updates.filter((item) => item.installedVersion != null).reduce((sum, item) => sum + item.bytes, 0) ?? 0;

  return (
    <Screen scroll>
      <Stack.Screen options={{ title }} />
      <Text style={type.h1}>{title}</Text>
      <Text style={type.muted}>
        {busy
          ? phase
          : result
            ? goingOffline
              ? 'Only missing or updated packages are offered. Nothing you already have is downloaded again.'
              : 'Checked this device against the library. Only new or updated packages would use data.'
            : checking
              ? phase
              : 'Could not finish the check.'}
      </Text>
      {result?.licenceDeniedReason ? (
        <Text style={[type.caption, { color: colors.warning }]}>{result.licenceDeniedReason}</Text>
      ) : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
      {syncNote ? <Text style={type.caption}>{syncNote}</Text> : null}

      {result ? (
        <Card>
          <Text style={type.h3}>
            {result.updates.length
              ? goingOffline
                ? 'Not yet on this device'
                : 'New or updated'
              : goingOffline
                ? 'Everything is already on this device'
                : 'Up to date'}
          </Text>
          <View style={{ marginTop: 12, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={type.body}>Already on this device</Text>
              <Text style={type.body}>{alreadyOnDevice}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={type.body}>New</Text>
              <Text style={type.body}>
                {newCount}
                {newCount ? ` · ${formatBytes(newBytes, estimated)}` : ''}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={type.body}>Updated</Text>
              <Text style={type.body}>
                {updateCount}
                {updateCount ? ` · ${formatBytes(updateBytes, estimated)}` : ''}
              </Text>
            </View>
            {result.updates.length ? (
              <>
                <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
                {groups.map((group) => (
                  <View key={group.kind} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[type.caption, { flex: 1, paddingRight: 12 }]}>
                      {CONTENT_KIND_LABEL[group.kind]} · {group.items.length}
                    </Text>
                    <Text style={type.caption}>{formatBytes(group.bytes, group.estimated)}</Text>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={type.h3}>To download</Text>
                  <Text style={type.h3}>{formatBytes(result.totalDownloadBytes, estimated)}</Text>
                </View>
              </>
            ) : (
              <Text style={[type.muted, { marginTop: 6 }]}>
                {goingOffline
                  ? 'You can turn Offline Mode on now. No extra download is needed.'
                  : 'Nothing new since your last download. No extra data will be used.'}
              </Text>
            )}
          </View>
        </Card>
      ) : null}

      {checking ? (
        <OutlineButton label="Cancel" onPress={() => router.back()} disabled={busy} />
      ) : error ? (
        <>
          <OutlineButton label="Cancel" onPress={() => router.back()} disabled={busy} />
          <PrimaryButton
            label="Try again"
            loading={busy}
            onPress={() => {
              setError(null);
              setAttempt((n) => n + 1);
            }}
          />
        </>
      ) : goingOffline && result?.updates.length ? (
        <>
          <OutlineButton
            label="Go offline without downloading"
            onPress={() => void skipDownloads()}
            disabled={busy}
          />
          <PrimaryButton
            label={busy ? phase : `Download ${formatBytes(result.totalDownloadBytes, estimated)} then go offline`}
            loading={busy}
            onPress={() => void download()}
          />
        </>
      ) : goingOffline ? (
        <>
          <OutlineButton label="Stay online" onPress={() => router.back()} disabled={busy} />
          <PrimaryButton label="Turn Offline Mode on" loading={busy} onPress={() => void finishOffline()} />
        </>
      ) : result?.updates.length ? (
        <>
          <OutlineButton label="Not now" onPress={() => void skipDownloads()} disabled={busy} />
          <PrimaryButton
            label={busy ? phase : `Download ${formatBytes(result.totalDownloadBytes, estimated)}`}
            loading={busy}
            onPress={() => void download()}
          />
        </>
      ) : (
        <PrimaryButton label="Done" loading={busy} onPress={() => void skipDownloads()} />
      )}
    </Screen>
  );
}
