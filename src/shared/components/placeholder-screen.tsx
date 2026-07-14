import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/shared/theme/use-app-theme';

interface PlaceholderScreenProps {
  title: string;
  description: string;
}

export function PlaceholderScreen({ title, description }: PlaceholderScreenProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { borderRadius: 20, borderWidth: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  description: { fontSize: 16, lineHeight: 24 },
});
