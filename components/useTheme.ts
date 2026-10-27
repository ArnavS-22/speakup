import { Palette, palette } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export function useTheme(): { scheme: 'light' | 'dark'; colors: Palette } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: palette(scheme) };
}
