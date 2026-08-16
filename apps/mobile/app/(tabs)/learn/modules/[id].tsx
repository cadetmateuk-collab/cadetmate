import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { href } from '../../../../lib/href';
import { webApi } from '../../../../lib/api';
import { LoadingScreen, OutlineButton, Screen } from '../../../../components/ui';
import { ModuleViewer } from '../../../../components/ModuleViewer';
import { modulePages, type ModuleRow } from '../../../../lib/modules';
import { loadLocalContent, useOffline } from '../../../../lib/offline';
import { type } from '../../../../theme';

export default function ModuleReaderScreen() {
  const rawId = useLocalSearchParams<{ id: string | string[]; section?: string | string[] }>();
  const id = Array.isArray(rawId.id) ? rawId.id[0] : rawId.id;
  const section = Array.isArray(rawId.section) ? rawId.section[0] : rawId.section;
  const router = useRouter();
  const { ready, canUseNetwork } = useOffline();
  const [mod, setMod] = useState<ModuleRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) {
      setMod(null);
      setLoading(false);
      return;
    }
    const local = await loadLocalContent<ModuleRow>('module', id);
    if (!canUseNetwork) {
      setMod(local);
      setLoading(false);
      return;
    }
    try {
      const remote = await webApi<ModuleRow>(`/api/modules?id=${encodeURIComponent(id)}`);
      setMod(remote);
    } catch {
      setMod(local);
    }
    setLoading(false);
  }, [id, canUseNetwork]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  const sectionIndex = Number(section);
  const initialPage = Number.isFinite(sectionIndex) && sectionIndex >= 1 ? sectionIndex - 1 : undefined;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {loading || !ready ? (
        <LoadingScreen />
      ) : !mod ? (
        <Screen>
          <Text style={type.muted}>
            This module is not on this device. Allow connectivity and download it from Manage offline content.
          </Text>
          <OutlineButton
            label="Manage offline content"
            onPress={() => router.push(href('/profile/offline-content'))}
          />
          <OutlineButton label="Back" onPress={() => router.back()} />
        </Screen>
      ) : (
        <ModuleViewer
          module={mod}
          pages={modulePages(mod)}
          initialPage={initialPage}
          onBack={() => router.back()}
        />
      )}
    </>
  );
}
