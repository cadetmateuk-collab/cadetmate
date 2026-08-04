import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0B1F3A' },
        headerTintColor: '#E8EEF7',
        tabBarStyle: { backgroundColor: '#0B1F3A', borderTopColor: '#1C3358' },
        tabBarActiveTintColor: '#5B8CFF',
        tabBarInactiveTintColor: '#8AA0C0',
      }}
    >
      <Tabs.Screen name="flashcards" options={{ title: 'Flashcards' }} />
      <Tabs.Screen name="sims" options={{ title: 'Simulators' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
