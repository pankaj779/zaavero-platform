import { useColorScheme } from 'react-native';

export interface Theme {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryText: string;
    success: string;
    warning: string;
    danger: string;
    overlay: string;
  };
  spacing: (n: number) => number;
  radius: { sm: number; md: number; lg: number; xl: number };
}

const light: Theme['colors'] = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  primary: '#4F46E5',
  primaryText: '#FFFFFF',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  overlay: 'rgba(15,23,42,0.4)',
};

const dark: Theme['colors'] = {
  background: '#0B1120',
  surface: '#111827',
  surfaceAlt: '#1E293B',
  border: '#1F2937',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  primary: '#6366F1',
  primaryText: '#FFFFFF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#F87171',
  overlay: 'rgba(0,0,0,0.6)',
};

export function createTheme(isDark: boolean): Theme {
  return {
    dark: isDark,
    colors: isDark ? dark : light,
    spacing: (n: number) => n * 4,
    radius: { sm: 8, md: 12, lg: 16, xl: 24 },
  };
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return createTheme(scheme === 'dark');
}
