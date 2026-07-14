import { Tabs } from 'expo-router';

import { useAppTheme } from '@/shared/theme/use-app-theme';

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Hôm nay' }} />
      <Tabs.Screen name="decks" options={{ title: 'Bộ thẻ' }} />
      <Tabs.Screen name="progress" options={{ title: 'Tiến độ' }} />
      <Tabs.Screen name="settings" options={{ title: 'Cài đặt' }} />
    </Tabs>
  );
}
