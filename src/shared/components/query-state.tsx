import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from './app-button';
import { useAppTheme } from '@/shared/theme/use-app-theme';

export function LoadingState() {
  const { colors } = useAppTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.textMuted }}>Đang tải…</Text>
    </View>
  );
}
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.center}>
      <Text style={{ color: colors.text }}>Không thể tải dữ liệu. Vui lòng thử lại.</Text>
      <AppButton label="Thử lại" onPress={onRetry} />
    </View>
  );
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={{ color: colors.textMuted, textAlign: 'center' }}>{description}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  center: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: '700' },
});
