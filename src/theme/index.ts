import { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  bg: '#FFF8F2',
  surface: '#FFFFFF',
  surfaceHigh: '#FFF1E8',
  border: '#F3E8DD',
  borderLight: '#EADCCE',

  textPrimary: '#2E2A26',
  textSecondary: '#7D746B',
  textMuted: '#B3A89D',

  primary: '#FF7A59',
  primaryDark: '#F25C3F',
  primarySoft: '#FFE8E0',
  mint: '#34C79A',
  mintSoft: '#E0F7EE',
  sky: '#58B9F4',
  skySoft: '#E3F3FD',
  sun: '#FFC145',
  sunSoft: '#FFF3D6',

  // Legacy keys kept so existing imports compile; remapped to the pastel set.
  green: '#34C79A',
  greenDark: '#22A87E',
  greenBg: '#E0F7EE',
  teal: '#3BC9B0',
  tealLight: '#6ADBC6',
  orange: '#FF9F45',
  blue: '#58B9F4',
  red: '#F4604F',
  redBg: '#FDE6E3',
  yellow: '#FFC145',
} as const;

export const gradients = {
  primary: ['#FF8A65', '#FF6B4A'] as const,
  ring: ['#FFA178', '#FF5E48'] as const,
  header: ['#FFEDE0', '#FFF8F2'] as const,
  card: ['#FFFFFF', '#FFFAF4'] as const,
  danger: ['#FF7B6E', '#F4513F'] as const,
  water: ['#7CC8F8', '#4DA9F0'] as const,
  orange: ['#FFC371', '#FF9F45'] as const,
} as const;

export const radius = {
  sm: 14,
  md: 18,
  card: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const typography: Record<string, TextStyle> = {
  display: { fontSize: 38, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  heading: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400', color: colors.textPrimary },
  bodyBold: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  caption: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
};

export const glow: ViewStyle = {
  shadowColor: '#FF6B4A',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.18,
  shadowRadius: 24,
  elevation: 6,
};

export const glowSubtle: ViewStyle = {
  shadowColor: '#FF6B4A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 3,
};

export const cardShadow: ViewStyle = {
  shadowColor: '#A0764F',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 3,
};
