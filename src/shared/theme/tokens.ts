export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const typography = {
  size: { caption: 12, body: 16, title: 24, display: 32 },
  lineHeight: { caption: 16, body: 24, title: 32, display: 40 },
} as const;

export const radius = { sm: 8, md: 12, lg: 20, full: 999 } as const;

export const lightColors = {
  primary: '#3157D5',
  background: '#F7F8FC',
  surface: '#FFFFFF',
  text: '#151A2D',
  textMuted: '#667085',
  border: '#E4E7EC',
  danger: '#B42318',
} as const;

export const darkColors = {
  primary: '#9CB0FF',
  background: '#10131F',
  surface: '#191E2F',
  text: '#F5F7FF',
  textMuted: '#AAB2C8',
  border: '#30374D',
  danger: '#FDA29B',
} as const;
