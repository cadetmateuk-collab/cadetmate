import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Flame, Trophy, Zap } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/AuthContext';
import { Card, IconWell, LoadingScreen, Screen, SectionLabel } from '../../../components/ui';
import { ProgressStore, withNetworkFallback } from '../../../lib/offline';
import { colors, type } from '../../../theme';

export default function ProgressScreen() {
  const { session } = useAuth();
  const [stats, setStats] = useState<{ study_streak?: number } | null>(null);
  const [xp, setXp] = useState<{ xp?: number; current_streak?: number; rank?: string } | null>(null);
  const [achievements, setAchievements] = useState<{ title?: string; description?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.user.id) {
      setLoading(false);
      return;
    }
    const uid = session.user.id;
    try {
      const result = await withNetworkFallback(
        async () => {
          const modules = await ProgressStore.allModules();
          const completed = modules.filter((row) => row.completed || row.progress >= 100).length;
          return {
            stats: { study_streak: 0 },
            xp: { xp: 0, current_streak: 0, rank: 'Cadet' },
            achievements: [
              {
                title: `${completed} module${completed === 1 ? '' : 's'} in progress on this device`,
                description: 'Full XP and achievements sync when you allow connectivity.',
              },
            ],
          };
        },
        async () => {
          const [stats, xp, achievements] = await Promise.all([
            supabase.from('user_statistics').select('study_streak').eq('user_id', uid).maybeSingle(),
            supabase.from('flashcard_user_xp').select('xp, current_streak, rank').eq('user_id', uid).maybeSingle(),
            supabase
              .from('user_achievements')
              .select('achievements(title, description)')
              .eq('user_id', uid)
              .order('unlocked_at', { ascending: false })
              .limit(12),
          ]);
          const rows = (achievements.data ?? []) as {
            achievements?: { title?: string; description?: string } | { title?: string; description?: string }[];
          }[];
          return {
            stats: stats.data,
            xp: xp.data,
            achievements: rows.map((row) => {
              const item = Array.isArray(row.achievements) ? row.achievements[0] : row.achievements;
              return { title: item?.title, description: item?.description };
            }),
          };
        },
      );
      setStats(result.stats);
      setXp(result.xp);
      setAchievements(result.achievements);
    } catch {
      setStats(null);
      setXp(null);
      setAchievements([]);
    }
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!session) return <Redirect href="/(auth)/login" />;
  if (loading) return <LoadingScreen />;

  return (
    <Screen scroll>
      <Text style={type.h1}>Progress</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card style={{ flex: 1 }}>
          <IconWell icon={Zap} tone="primary" />
          <Text style={[type.label, { marginTop: 12 }]}>XP</Text>
          <Text style={[type.h1, { color: colors.primary, fontSize: 32 }]}>{xp?.xp ?? 0}</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <IconWell icon={Flame} tone="amber" />
          <Text style={[type.label, { marginTop: 12 }]}>Streak</Text>
          <Text style={[type.h1, { color: colors.warning, fontSize: 32 }]}>
            {xp?.current_streak ?? stats?.study_streak ?? 0}
          </Text>
        </Card>
      </View>
      <Card>
        <IconWell icon={Trophy} tone="brass" />
        <Text style={[type.label, { marginTop: 12 }]}>Rank</Text>
        <Text style={type.h3}>{String(xp?.rank ?? 'Cadet')}</Text>
      </Card>
      <SectionLabel>Achievements</SectionLabel>
      {achievements.length === 0 ? (
        <Text style={type.muted}>No achievements unlocked yet.</Text>
      ) : (
        achievements.map((item, i) => (
          <Card key={i}>
            <Text style={type.h3}>{item.title}</Text>
            <Text style={type.muted}>{item.description}</Text>
          </Card>
        ))
      )}
    </Screen>
  );
}
