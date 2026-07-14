import { ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { Suspense } from 'react';

import { DATABASE_NAME } from '@/database/database';
import { initializeDatabase } from '@/database/initialize-database';
import { queryClient } from '@/services/query/query-client';
import { DatabaseLoadingScreen } from '@/shared/components/database-loading-screen';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { useNotificationResponseHandler } from '@/features/notifications/hooks/use-notification-response-handler';

export default function RootLayout() {
  const { navigationTheme } = useAppTheme();
  useNotificationResponseHandler();

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<DatabaseLoadingScreen />}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase} useSuspense>
          <ThemeProvider value={navigationTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </ThemeProvider>
        </SQLiteProvider>
      </Suspense>
    </QueryClientProvider>
  );
}
