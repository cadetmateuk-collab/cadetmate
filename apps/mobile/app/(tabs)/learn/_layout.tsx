import { Stack } from 'expo-router';
import { colors, fonts } from '../../../theme';

export default function LearnStack() {
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
      <Stack.Screen name="modules" options={{ headerShown: false }} />
      <Stack.Screen name="flashcards/index" options={{ title: 'Flashcards' }} />
      <Stack.Screen name="study/[slug]" options={{ title: 'Study' }} />
      <Stack.Screen name="articles" options={{ headerShown: false }} />
      <Stack.Screen name="survival/index" options={{ title: 'Sea survival' }} />
      <Stack.Screen name="survival/[slug]" options={{ title: 'Article' }} />
    </Stack>
  );
}
