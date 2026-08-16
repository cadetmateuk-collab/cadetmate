import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { AuthProvider } from '../lib/AuthContext';
import { OfflineProvider } from '../lib/offline';
import { StudyActivityTracker } from '../lib/StudyActivityTracker';
import { LoadingScreen } from '../components/ui';
import { colors, fonts } from '../theme';

export default function RootLayout() {
  const [loaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!loaded) return <LoadingScreen />;

  return (
    <AuthProvider>
      <OfflineProvider>
      <StudyActivityTracker />
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.bold, fontWeight: '700', color: colors.text },
          headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/reset" options={{ title: 'Reset password' }} />
        <Stack.Screen name="(auth)/onboarding" options={{ title: 'Welcome', headerBackVisible: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ title: 'New password' }} />
      </Stack>
      </OfflineProvider>
    </AuthProvider>
  );
}
