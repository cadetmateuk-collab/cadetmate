import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';

export default function LoginScreen() {
  const { session, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Redirect href="/(tabs)/flashcards" />;

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    const message =
      mode === 'login'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, fullName.trim());
    if (message) setError(message);
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>CadetMate</Text>
      <Text style={styles.sub}>Study flashcards on the go</Text>

      {mode === 'signup' && (
        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor="#8AA0C0"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#8AA0C0"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#8AA0C0"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.primary} onPress={onSubmit} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>
        )}
      </Pressable>

      <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        <Text style={styles.link}>
          {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1F3A',
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  brand: { color: '#E8EEF7', fontSize: 32, fontWeight: '700' },
  sub: { color: '#8AA0C0', marginBottom: 12 },
  input: {
    backgroundColor: '#132A4A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#E8EEF7',
  },
  primary: {
    backgroundColor: '#2F6BFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: { color: '#fff', fontWeight: '600' },
  link: { color: '#9CBCFF', textAlign: 'center', marginTop: 8 },
  error: { color: '#FF8A8A' },
});
