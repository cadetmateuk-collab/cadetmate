import { Stack } from 'expo-router';
import { colors } from '../../../theme';

export default function PracticeStack() {
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
      <Stack.Screen name="quiz" options={{ title: 'Daily quiz' }} />
      <Stack.Screen name="orals" options={{ title: 'Oral questions' }} />
    </Stack>
  );
}
