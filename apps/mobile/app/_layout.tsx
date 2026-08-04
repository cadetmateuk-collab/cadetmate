import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0B1F3A' },
          headerTintColor: '#E8EEF7',
          contentStyle: { backgroundColor: '#0B1F3A' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ title: 'Sign in' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="study/[slug]" options={{ title: 'Study' }} />
        <Stack.Screen
          name="webview"
          options={{ title: 'CadetMate Web', presentation: 'modal' }}
        />
      </Stack>
    </AuthProvider>
  );
}
