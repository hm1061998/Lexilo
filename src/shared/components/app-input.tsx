import type { TextInputProps } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '@/shared/theme/use-app-theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}
export function AppInput({ label, error, style, ...props }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
          },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  error: { fontSize: 13 },
});
