import { Tabs } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { useAppTheme } from '@/shared/theme/use-app-theme';

type TabSymbolName = SymbolViewProps['name'];

function TabIcon({ name, color, size }: { name: TabSymbolName; color: ColorValue; size: number }) {
  return <SymbolView name={name} tintColor={color} size={size} type="hierarchical" />;
}

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
      <Tabs.Screen
        name="home"
        options={{
          title: 'Hôm nay',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name={{ ios: 'house.fill', android: 'home', web: 'home' }} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="decks"
        options={{
          title: 'Bộ thẻ',
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              name={{ ios: 'rectangle.stack.fill', android: 'collections_bookmark', web: 'collections_bookmark' }}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Tiến độ',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name={{ ios: 'chart.bar.fill', android: 'monitoring', web: 'monitoring' }} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
