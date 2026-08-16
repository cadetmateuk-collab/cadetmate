import { Stack } from 'expo-router';
import { colors, fonts } from '../../../theme';

export default function ProfileStack() {
  return (
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
      <Stack.Screen name="store/index" options={{ title: 'Store' }} />
      <Stack.Screen name="store/[slug]" options={{ title: 'Product' }} />
      <Stack.Screen name="progress" options={{ title: 'Progress' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="connect" options={{ title: 'Going online' }} />
      <Stack.Screen name="offline-content" options={{ title: 'Offline content' }} />
    </Stack>
  );
}
