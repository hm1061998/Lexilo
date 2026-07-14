import type { Theme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors } from './tokens';

export function useAppTheme() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const navigationTheme: Theme = {
    dark: colorScheme === 'dark',
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '800' },
    },
  };

  return { colorScheme, colors, navigationTheme };
}
