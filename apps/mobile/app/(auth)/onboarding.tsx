import { useState } from 'react';
import { Text } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { ErrorText, Field, OutlineButton, PrimaryButton, Screen } from '../../components/ui';
import { colors, type } from '../../theme';

const PHASES = [
  { id: 'phase_1', label: 'Phase 1' },
  { id: 'phase_2', label: 'Phase 2' },
  { id: 'phase_3', label: 'Phase 3' },
  { id: 'qualified_officer', label: 'Qualified Officer' },
  { id: 'other', label: 'Other' },
];

export default function OnboardingScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [college, setCollege] = useState('');
  const [phase, setPhase] = useState('phase_1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) return <Redirect href="/(auth)/login" />;
  if (profile?.onboarding_completed) return <Redirect href="/(tabs)/home" />;

  const onSubmit = async () => {
    if (fullName.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (!college.trim()) {
      setError('Please enter your nautical college.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        nautical_college: college.trim(),
        training_phase: phase,
        learning_interests: ['navigation'],
        referral_source: 'other',
        onboarding_completed: true,
      })
      .eq('id', session.user.id);
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    await refreshProfile();
    setBusy(false);
    router.replace('/(tabs)/home');
  };

  return (
    <Screen scroll>
      <Text style={type.h2}>Tell us about you</Text>
      <Text style={type.muted}>A few details so we can tailor study resources.</Text>
      <Field placeholder="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
      <Field placeholder="Nautical college" value={college} onChangeText={setCollege} />
      <Text style={[type.label, { marginTop: 8 }]}>Training phase</Text>
      {PHASES.map((item) =>
        phase === item.id ? (
          <PrimaryButton key={item.id} label={item.label} onPress={() => setPhase(item.id)} />
        ) : (
          <OutlineButton key={item.id} label={item.label} onPress={() => setPhase(item.id)} />
        ),
      )}
      {error ? <ErrorText>{error}</ErrorText> : null}
      <PrimaryButton label="Continue" loading={busy} onPress={onSubmit} />
    </Screen>
  );
}
