import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { openWebFeature } from '../../lib/openWeb';

export default function AccountScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Signed in as</Text>
      <Text style={styles.email}>{session.user.email}</Text>

      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({ pathname: '/webview', params: { path: '/profile', title: 'Profile' } })
        }
      >
        <Text style={styles.cardText}>Open profile (web)</Text>
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => openWebFeature('/store', 'browser')}
      >
        <Text style={styles.cardText}>Upgrade / store</Text>
      </Pressable>

      <Pressable
        style={styles.danger}
        onPress={async () => {
          await signOut();
          router.replace('/(auth)/login');
        }}
      >
        <Text style={styles.dangerText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1F3A', padding: 16, gap: 12 },
  label: { color: '#8AA0C0' },
  email: { color: '#E8EEF7', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  card: {
    backgroundColor: '#132A4A',
    borderRadius: 10,
    padding: 14,
  },
  cardText: { color: '#E8EEF7' },
  danger: {
    marginTop: 16,
    backgroundColor: '#8B2E2E',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  dangerText: { color: '#fff', fontWeight: '600' },
});
