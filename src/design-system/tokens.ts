/**
 * Design System Tokens
 * Central source of truth for all design values
 */

// ============================================================================
// Color Palette
// ============================================================================

export const colors = {
  // Brand Colors
  brand: {
    primary: '#e87e4f',
    primaryHover: '#d6693a',
    primaryDark: '#b6420f',
    secondary: '#f0f2f5',
  },

  // Semantic Colors
  semantic: {
    success: '#52c41a',
    successDark: '#327a0e',
    successLight: '#73d13d',
    warning: '#faad14',
    warningDark: '#d48806',
    warningLight: '#ffc53d',
    danger: '#ff4d4f',
    dangerDark: '#d43838',
    dangerLight: '#ff7875',
    info: '#1890ff',
    infoDark: '#1352ff',
    infoLight: '#40a9ff',
  },

  // Gray Scale
  gray: {
    50: '#f9f9f9',
    100: '#f5f5f5',
    200: '#f0f0f0',
    300: '#e0e0e0',
    400: '#cccccc',
    500: '#999999',
    600: '#666666',
    700: '#4a5568',
    800: '#2d3748',
    900: '#1a202c',
    950: '#0f1419',
  },

  // Attribution Colors (for blockchain entities)
  attribution: {
    DEFAULT: '#e87d4f',
    light: '#a34015',
    hover: '#c74d1a',
    reference: '#8d23b1',
    referenceHover: '#cf45fe',
  },

  // Base Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ============================================================================
// Typography Scale
// ============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
    mono: ['SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
  },

  // Font Sizes (with line heights)
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
    '5xl': ['3rem', { lineHeight: '1' }],          // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],       // 60px
  },

  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// ============================================================================
// Spacing Scale (based on 4px grid)
// ============================================================================

export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px',
} as const;

// ============================================================================
// Border Radius
// ============================================================================

export const borderRadius = {
  none: '0px',
  sm: '4px',
  DEFAULT: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
} as const;

// ============================================================================
// Shadows
// ============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// ============================================================================
// Z-Index Scale
// ============================================================================

export const zIndex = {
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  auto: 'auto',
  // Specific use cases
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const;

// ============================================================================
// Icon Sizes (for consistency)
// ============================================================================

export const iconSizes = {
  xs: '12px',  // Inline small icons
  sm: '16px',  // Default inline icons
  md: '20px',  // Button icons, list icons
  lg: '24px',  // Header icons, empty states
  xl: '32px',  // Feature icons
  '2xl': '48px', // Large feature icons
} as const;

// ============================================================================
// Breakpoints (for responsive design)
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Animation/Transition
// ============================================================================

export const transitions = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  timing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ============================================================================
// Component-Specific Tokens
// ============================================================================

export const components = {
  // Button
  button: {
    height: {
      sm: '32px',
      md: '40px',
      lg: '48px',
    },
    padding: {
      sm: '0 12px',
      md: '0 16px',
      lg: '0 24px',
    },
  },

  // Card
  card: {
    padding: spacing[6], // 24px
    borderRadius: borderRadius.lg,
    shadow: shadows.sm,
  },

  // Modal
  modal: {
    padding: spacing[6], // 24px
    borderRadius: borderRadius.lg,
    maxWidth: '560px',
  },

  // Input
  input: {
    height: '40px',
    padding: '0 12px',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base[0],
  },

  // Table
  table: {
    headerHeight: '48px',
    rowHeight: '52px',
    cellPadding: spacing[4], // 16px
  },
} as const;

// ============================================================================
// Theme-Specific Tokens (for CSS variables)
// ============================================================================

export const lightTheme = {
  // Backgrounds
  background: colors.white,
  backgroundSecondary: colors.gray[50],
  backgroundTertiary: colors.gray[100],

  // Text
  foreground: colors.gray[900],
  foregroundSecondary: colors.gray[600],
  foregroundTertiary: colors.gray[500],

  // Borders
  border: colors.gray[200],
  borderSecondary: colors.gray[300],

  // Interactive
  primary: colors.brand.primary,
  primaryForeground: colors.white,

  // Cards/Surfaces
  card: colors.white,
  cardForeground: colors.gray[900],

  // Inputs
  input: colors.gray[200],
  inputForeground: colors.gray[900],
  inputPlaceholder: colors.gray[500],
} as const;

export const darkTheme = {
  // Backgrounds
  background: colors.gray[950],
  backgroundSecondary: colors.gray[900],
  backgroundTertiary: colors.gray[800],

  // Text
  foreground: colors.gray[50],
  foregroundSecondary: colors.gray[400],
  foregroundTertiary: colors.gray[500],

  // Borders
  border: colors.gray[800],
  borderSecondary: colors.gray[700],

  // Interactive
  primary: colors.brand.primary,
  primaryForeground: colors.white,

  // Cards/Surfaces
  card: colors.gray[900],
  cardForeground: colors.gray[50],

  // Inputs
  input: colors.gray[800],
  inputForeground: colors.white,
  inputPlaceholder: colors.gray[400],
} as const;

// ============================================================================
// Utility Types
// ============================================================================

export type ColorValue = typeof colors[keyof typeof colors][keyof typeof colors[keyof typeof colors]] | typeof colors[keyof typeof colors];
export type SpacingValue = typeof spacing[keyof typeof spacing];
export type FontSizeValue = typeof typography.fontSize[keyof typeof typography.fontSize];
export type ShadowValue = typeof shadows[keyof typeof shadows];
export type BorderRadiusValue = typeof borderRadius[keyof typeof borderRadius];