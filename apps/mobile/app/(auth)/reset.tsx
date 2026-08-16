import { useState } from 'react';
import { Text } from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import { ErrorText, Field, PrimaryButton, Screen } from '../../components/ui';
import { type } from '../../theme';

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    const message = await resetPassword(email.trim());
    if (message) setError(message);
    else setSent(true);
    setBusy(false);
  };

  return (
    <Screen>
      <Text style={type.h2}>Reset password</Text>
      <Text style={[type.muted, { marginBottom: 8 }]}>
        We will email you a link that opens back in the CadetMate app.
      </Text>
      <Field
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
      {sent ? <Text style={type.muted}>Check your inbox for the reset link.</Text> : null}
      <PrimaryButton label="Send reset link" loading={busy} onPress={onSubmit} />
    </Screen>
  );
}
