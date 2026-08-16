import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { href } from '../../../lib/href';
import { LoadingScreen, OutlineButton, Screen } from '../../../components/ui';
import { loadLocalContent, withNetworkFallback } from '../../../lib/offline';
import { type } from '../../../theme';

type Step = { step?: string | number; title?: string; description?: string };

type TrbTask = {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  guidance?: string;
  steps?: Step[];
};

export default function TrbDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<TrbTask | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) {
      setTask(null);
      setLoading(false);
      return;
    }
    const next = await withNetworkFallback(
      async () => {
        const local = await loadLocalContent<{ tasks: TrbTask[] }>('trb', 'trb_tasks');
        return local?.tasks.find((row) => row.id === id) ?? null;
      },
      async () => {
        const { data } = await supabase.from('trb_tasks').select('*').eq('id', id).maybeSingle();
        return data as TrbTask | null;
      },
    );
    setTask(next);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingScreen />;
  if (!task) {
    return (
      <Screen>
        <Text style={type.muted}>
          This TRB task is not on this device. Allow connectivity and download TRB from Going online.
        </Text>
        <OutlineButton label="Manage offline content" onPress={() => router.push(href('/profile/offline-content'))} />
        <OutlineButton label="Back" onPress={() => router.back()} />
      </Screen>
    );
  }

  const steps = Array.isArray(task.steps) ? task.steps : [];

  return (
    <Screen scroll>
      <Text style={type.caption}>{task.category}</Text>
      <Text style={type.h2}>
        {task.code} · {task.title}
      </Text>
      <Text style={type.body}>{task.description}</Text>
      {task.guidance ? (
        <View>
          <Text style={type.h3}>Guidance</Text>
          <Text style={type.muted}>{task.guidance}</Text>
        </View>
      ) : null}
      {steps.map((step, i) => (
        <View key={i}>
          <Text style={type.h3}>
            Step {step.step ?? i + 1}: {step.title}
          </Text>
          <Text style={type.muted}>{step.description}</Text>
        </View>
      ))}
    </Screen>
  );
}
