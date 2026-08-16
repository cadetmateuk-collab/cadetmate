import { Redirect } from 'expo-router';
import { useAuth } from '../lib/AuthContext';
import { LoadingScreen } from '../components/ui';

export default function Index() {
  const { session, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <Redirect href="/(auth)/login" />;
  if (profile && profile.onboarding_completed === false) {
    return <Redirect href="/(auth)/onboarding" />;
  }
  return <Redirect href="/(tabs)/home" />;
}
