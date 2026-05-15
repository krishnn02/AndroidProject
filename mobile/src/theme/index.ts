export const colors = {
  primary: '#6C3CE0',
  primaryLight: '#8B5CF6',
  primaryDark: '#5B21B6',
  secondary: '#3B82F6',
  accent: '#D946EF',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  bg: '#0F0F1A',
  bgCard: '#1A1A2E',
  bgElevated: '#242442',
  bgInput: '#16162A',

  text: '#FFFFFF',
  textSecondary: '#A0A0C0',
  textMuted: '#6B6B8D',
  textInverse: '#0F0F1A',

  border: '#2A2A4A',
  borderLight: '#3A3A5A',

  gradientPurple: ['#6C3CE0', '#D946EF'] as const,
  gradientBlue: ['#3B82F6', '#6C3CE0'] as const,
  gradientDark: ['#0F0F1A', '#1A1A2E'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#6C3CE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6C3CE0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
};
