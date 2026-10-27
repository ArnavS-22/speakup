import { TextStyle } from 'react-native';

export const light = {
  background: '#FAFAF9',
  text: '#111111',
  secondary: '#6B6B6B',
  hairline: '#E6E6E3',
  subtle: '#F3F3F1',
  inverted: '#FAFAF9',
  canAct: '#2F8F5B',
  canListen: '#B7791F',
  betterContact: '#2B6CB0',
};

export const dark = {
  background: '#0E0E0E',
  text: '#EDEDED',
  secondary: '#8A8A8A',
  hairline: '#262626',
  subtle: '#161616',
  inverted: '#0E0E0E',
  canAct: '#2F8F5B',
  canListen: '#B7791F',
  betterContact: '#2B6CB0',
};

export type Palette = typeof light;

export const space = 8;
export const screenPad = 20;
export const radius = 12;
export const tapTarget = 44;
export const motionMs = 180;
export const iconStroke = 1.5;

/** Four type sizes for the whole app. */
export const type = {
  title: {
    fontSize: 32,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.64,
    lineHeight: 38,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 24,
    letterSpacing: 0,
  },
  label: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono_400Regular',
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.72,
    lineHeight: 16,
  },
  display: {
    fontSize: 48,
    fontFamily: 'JetBrainsMono_400Regular',
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
    lineHeight: 56,
  },
};

export function palette(scheme: 'light' | 'dark' | null | undefined): Palette {
  return scheme === 'dark' ? dark : light;
}
