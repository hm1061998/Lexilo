import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/shared/theme/use-app-theme';
export function StudyProgressBar({ current, total }: { current: number; total: number }) {
  const { colors } = useAppTheme();
  const value = total ? Math.min(1, current / total) : 0;
  return (
    <View style={styles.wrap} accessibilityRole="progressbar">
      <Text style={{ color: colors.textMuted }}>
        {current}/{total}
      </Text>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View
          style={[styles.fill, { backgroundColor: colors.primary, width: `${value * 100}%` }]}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { gap: 6 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});
