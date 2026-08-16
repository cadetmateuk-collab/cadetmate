import { Stack } from 'expo-router';
import { colors } from '../../../theme';

export default function CommunityStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Post' }} />
      <Stack.Screen name="compose" options={{ title: 'New post' }} />
    </Stack>
  );
}
