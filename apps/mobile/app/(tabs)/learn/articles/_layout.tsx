import { Stack } from 'expo-router';
import { colors, fonts } from '../../../../theme';

export default function ArticlesStack() {
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
      <Stack.Screen name="index" options={{ title: 'Articles' }} />
      <Stack.Screen name="[slug]" options={{ title: 'Article' }} />
    </Stack>
  );
}
