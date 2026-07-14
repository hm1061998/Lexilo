import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/shared/theme/use-app-theme';

export function DatabaseLoadingScreen() {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View
        style={styles.content}
        accessibilityRole="progressbar"
        accessibilityLabel="Đang chuẩn bị dữ liệu"
      >
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.title, { color: colors.text }]}>Đang chuẩn bị Lexilo</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Khởi tạo dữ liệu học offline…
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 12 },
  description: { fontSize: 16, textAlign: 'center' },
});
