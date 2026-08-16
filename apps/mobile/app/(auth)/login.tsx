import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { BrandImage } from '../../components/BrandImage';
import { ErrorText, Field, PrimaryButton, Screen, Subheading } from '../../components/ui';
import { colors, fonts, type } from '../../theme';

export default function LoginScreen() {
  const { session, profile, signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) {
    if (profile && profile.onboarding_completed === false) {
      return <Redirect href="/(auth)/onboarding" />;
    }
    return <Redirect href="/(tabs)/home" />;
  }

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const message =
        mode === 'login'
          ? await signIn(email.trim(), password)
          : await signUp(email.trim(), password, fullName.trim());
      if (message) setError(message);
      else if (mode === 'signup') router.replace('/(auth)/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll safeTop>
      <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 8 }}>
        <BrandImage name="logo" style={{ width: 72, height: 72 }} />
      </View>
      <Text style={[type.h1, { color: colors.primary, textAlign: 'center' }]}>CadetMate</Text>
      <Subheading>
        {mode === 'login' ? 'Sign in to continue studying.' : 'Create a free account to get started.'}
      </Subheading>

      {mode === 'signup' && (
        <Field
          placeholder="Full name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
      )}
      <Field
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Field
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <ErrorText>{error}</ErrorText> : null}

      <PrimaryButton
        label={mode === 'login' ? 'Sign in' : 'Create account'}
        loading={busy}
        onPress={onSubmit}
      />

      <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        <Text style={{ color: colors.primary, textAlign: 'center', marginTop: 8, fontFamily: fonts.semibold }}>
          {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
        </Text>
      </Pressable>

      {mode === 'login' ? (
        <Pressable onPress={() => router.push('/(auth)/reset')}>
          <Text style={{ color: colors.textMuted, textAlign: 'center', fontFamily: fonts.regular }}>Forgot password?</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}
