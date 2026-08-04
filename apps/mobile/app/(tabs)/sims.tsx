import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { WEB_ONLY_PATHS } from '@cadet-mate/shared/config';
import { openWebFeature } from '../../lib/openWeb';

const SIMS = [
  { path: '/simulator', label: 'Emergency bridge simulator', note: 'Premium · opens web' },
  { path: '/buoyage', label: 'IALA buoyage', note: 'Premium · opens web' },
  { path: '/bridge', label: '3D ship bridge', note: 'Opens web' },
  { path: '/instructor', label: 'Instructor panel', note: 'Opens web' },
] as const;

export default function SimsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.lead}>
        Heavy 3D simulators stay on the web for now. They open in an in-app browser
        so progress and auth stay on CadetMate.
      </Text>
      {SIMS.map((sim) => (
        <Pressable
          key={sim.path}
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: '/webview',
              params: { path: sim.path, title: sim.label },
            })
          }
        >
          <Text style={styles.title}>{sim.label}</Text>
          <Text style={styles.meta}>{sim.note}</Text>
        </Pressable>
      ))}

      <Pressable
        style={styles.secondary}
        onPress={() => openWebFeature('/store', 'browser')}
      >
        <Text style={styles.secondaryText}>Open Premium store in browser</Text>
      </Pressable>

      <Text style={styles.footer}>
        Web-only paths: {WEB_ONLY_PATHS.join(', ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1F3A', padding: 16, gap: 10 },
  lead: { color: '#B7C7DE', marginBottom: 8, lineHeight: 20 },
  card: {
    backgroundColor: '#132A4A',
    borderRadius: 12,
    padding: 16,
  },
  title: { color: '#E8EEF7', fontWeight: '600', fontSize: 16 },
  meta: { color: '#8AA0C0', marginTop: 4 },
  secondary: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2F6BFF',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  secondaryText: { color: '#9CBCFF', fontWeight: '600' },
  footer: { color: '#5A7194', fontSize: 11, marginTop: 16 },
});
