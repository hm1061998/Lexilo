import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '@/shared/theme/use-app-theme';

interface Props extends Omit<PressableProps, 'style'> {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'secondary';
  style?: StyleProp<ViewStyle>;
}
export function AppButton({
  label,
  loading,
  variant = 'primary',
  disabled,
  style,
  ...props
}: Props) {
  const { colors } = useAppTheme();
  const backgroundColor =
    variant === 'secondary'
      ? colors.surface
      : variant === 'danger'
        ? colors.danger
        : colors.primary;
  const textColor = variant === 'secondary' ? colors.text : colors.background;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor: colors.border,
          opacity: disabled || loading ? 0.55 : pressed ? 0.8 : 1,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  label: { fontSize: 16, fontWeight: '700' },
});
