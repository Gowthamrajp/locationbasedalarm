// Design System: "Horizon Pulse" - The Vigilant Path
// Based on Stitch project design tokens

export const Colors = {
  primary: '#0040a1',
  primaryContainer: '#0056d2',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#ccd8ff',
  primaryFixed: '#dae2ff',
  primaryFixedDim: '#b2c5ff',
  onPrimaryFixed: '#001847',
  onPrimaryFixedVariant: '#0040a1',

  secondary: '#a43c12',
  secondaryContainer: '#fe7e4f',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#6b1f00',
  secondaryFixed: '#ffdbcf',
  secondaryFixedDim: '#ffb59c',
  onSecondaryFixed: '#380c00',
  onSecondaryFixedVariant: '#822800',

  tertiary: '#5b4300',
  tertiaryContainer: '#795900',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#ffd274',
  tertiaryFixed: '#ffdfa0',
  tertiaryFixedDim: '#fbbc00',
  onTertiaryFixed: '#261a00',
  onTertiaryFixedVariant: '#5c4300',

  surface: '#faf8ff',
  surfaceDim: '#d9d9e4',
  surfaceBright: '#faf8ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f3fe',
  surfaceContainer: '#ededf8',
  surfaceContainerHigh: '#e7e7f2',
  surfaceContainerHighest: '#e1e2ec',
  surfaceVariant: '#e1e2ec',
  surfaceTint: '#0056d2',

  onSurface: '#191b23',
  onSurfaceVariant: '#424654',
  onBackground: '#191b23',
  background: '#faf8ff',

  outline: '#737785',
  outlineVariant: '#c3c6d6',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  inverseSurface: '#2e3038',
  inverseOnSurface: '#f0f0fb',
  inversePrimary: '#b2c5ff',

  // Neutral tonal palette
  neutral: {
    t0: '#000000',
    t10: '#191b23',
    t20: '#2e3038',
    t30: '#44464f',
    t40: '#5c5e67',
    t50: '#757780',
    t60: '#8f909a',
    t70: '#a9abb5',
    t80: '#c5c6d0',
    t90: '#e1e2ec',
    t95: '#f0f0fb',
    t100: '#ffffff',
  },
};

export const Typography = {
  displayLg: {
    fontFamily: 'Manrope',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  displayMd: {
    fontFamily: 'Manrope',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  headlineLg: {
    fontFamily: 'Manrope',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headlineMd: {
    fontFamily: 'Manrope',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headlineSm: {
    fontFamily: 'Manrope',
    fontSize: 24,
    fontWeight: '700',
  },
  titleLg: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 22,
    fontWeight: '600',
  },
  titleMd: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 18,
    fontWeight: '600',
  },
  titleSm: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 16,
    fontWeight: '600',
  },
  bodyLg: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySm: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  labelLg: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 14,
    fontWeight: '600',
  },
  labelMd: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 12,
    fontWeight: '600',
  },
  labelSm: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};
