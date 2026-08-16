import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { ErrorText, Field, PrimaryButton, Screen } from '../components/ui';
import { type } from '../theme';

export default function NewPasswordScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) setError(err.message);
    else {
      setDone(true);
      router.replace('/(tabs)/home');
    }
  };

  if (!session) {
    return (
      <Screen>
        <Text style={type.h2}>Open the email link</Text>
        <Text style={type.muted}>
          Use the reset link we sent you. It will return you here so you can choose a new password.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={type.h2}>Choose a new password</Text>
      <Field
        placeholder="New password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
      {done ? <Text style={type.muted}>Password updated.</Text> : null}
      <PrimaryButton label="Save password" loading={busy} onPress={onSubmit} />
    </Screen>
  );
}
