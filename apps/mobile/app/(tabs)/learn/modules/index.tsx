import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { BookOpen, ChevronRight, Search } from 'lucide-react-native';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../lib/AuthContext';
import { href, moduleHref } from '../../../../lib/href';
import { ErrorText, Field, LoadingScreen, PremiumLock, Screen } from '../../../../components/ui';
import type { ModuleRow } from '../../../../lib/modules';
import { loadInstalledPayloads, ProgressStore, resolveMediaUri, useOffline, withNetworkFallback } from '../../../../lib/offline';
import { colors, fonts, radius, shadow } from '../../../../theme';

function usableCover(url: string | null | undefined) {
  return resolveMediaUri(url);
}

export default function ModulesScreen() {
  const router = useRouter();
  const { isPremium, session } = useAuth();
  const { canUseNetwork } = useOffline();
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [progressById, setProgressById] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('All');

  const loadProgress = useCallback(async () => {
    const map: Record<string, number> = {};
    const local = await ProgressStore.allModules();
    for (const row of local) {
      map[row.module_id] = row.progress;
    }
    if (canUseNetwork && session?.user.id) {
      const { data } = await supabase
        .from('user_module_progress')
        .select('module_id, progress')
        .eq('user_id', session.user.id);
      for (const row of data ?? []) {
        if (!row.module_id) continue;
        map[row.module_id] = Math.max(map[row.module_id] ?? 0, Number(row.progress) || 0);
      }
    }
    setProgressById(map);
  }, [canUseNetwork, session?.user.id]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await withNetworkFallback(
        () => loadInstalledPayloads<ModuleRow>('module'),
        async () => {
          const full =
            'id, title, description, category, subcategory, slug, is_premium, hidden, image_url, tags';
          const { data, error: err } = await supabase
            .from('modules')
            .select(full)
            .or('hidden.eq.false,hidden.is.null')
            .order('title');
          if (!err) return (data ?? []) as ModuleRow[];
          const fallback = await supabase
            .from('modules')
            .select('id, title, description, category, subcategory, slug, is_premium, hidden, image_url')
            .or('hidden.eq.false,hidden.is.null')
            .order('title');
          if (fallback.error) throw new Error(fallback.error.message);
          return (fallback.data ?? []) as ModuleRow[];
        },
      );
      setModules(rows);
      await loadProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load modules');
    }
    setLoading(false);
  }, [loadProgress]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void loadProgress();
    }, [loadProgress]),
  );

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const m of modules) {
      if (m.category) set.add(m.category);
      for (const t of m.tags ?? []) {
        if (t) set.add(t);
      }
    }
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [modules]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return modules.filter((m) => {
      if (m.hidden) return false;
      const hay = `${m.title} ${m.description ?? ''} ${m.category} ${m.subcategory} ${(m.tags ?? []).join(' ')}`.toLowerCase();
      const matchesSearch = !q || hay.includes(q);
      const matchesTag =
        tag === 'All' || m.category === tag || (m.tags ?? []).includes(tag);
      return matchesSearch && matchesTag;
    });
  }, [modules, search, tag]);

  if (loading) return <LoadingScreen />;
  if (!isPremium) {
    return (
      <Screen>
        <PremiumLock
          message="Learning modules are included with CadetMate Premium."
          onExplore={() => router.push(href('/profile/store'))}
        />
      </Screen>
    );
  }

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
                placeholder="Search modules…"
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
          const cover = usableCover(item.image_url);
          const pct = Math.min(100, Math.max(0, Math.round(progressById[item.id] ?? 0)));
          return (
            <Pressable
              onPress={() => router.push(moduleHref(item.id))}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.88 }]}
            >
              {cover ? (
                <Image source={{ uri: cover }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <BookOpen size={20} color={colors.primary} strokeWidth={1.75} />
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
                <Text style={styles.meta} numberOfLines={1}>
                  {[item.category, item.subcategory].filter(Boolean).join(' · ')}
                </Text>
                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.pct}>{pct}%</Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.75} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {modules.length === 0
              ? 'No modules on this device yet. Allow connectivity and download courses from Manage offline content.'
              : 'No modules match that search or tag.'}
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
  progressRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 8,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%' as const,
    borderRadius: 99,
    backgroundColor: colors.primary,
  },
  pct: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primary,
    minWidth: 32,
    textAlign: 'right' as const,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center' as const,
    marginTop: 24,
  },
};
