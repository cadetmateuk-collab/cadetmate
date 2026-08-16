import { Stack } from 'expo-router';
import { colors, fonts } from '../../../../theme';

export default function ModulesStack() {
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
      <Stack.Screen name="index" options={{ title: 'Modules' }} />
      <Stack.Screen name="[id]" options={{ headerShown: false, title: 'Module' }} />
    </Stack>
  );
}
