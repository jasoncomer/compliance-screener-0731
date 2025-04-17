// Base colors
export const colors = {
  // Brand colors
  primary: '#e87e4f',
  primaryDark: '#b6420f',
  secondary: '#f0f2f5',

  // Semantic colors
  success: '#52c41a',
  successDark: '#327a0e',
  warning: '#faad14',
  warningDark: '#d48806',
  danger: '#ff4d4f',
  dangerDark: '#d43838',
  info: '#1890ff',
  infoDark: '#1352ff',

  // Neutral colors
  light: '#f0f2f5',
  dark: '#000',
  white: '#fff',
  black: '#000',
  gray: {
    50: '#f9f9f9',
    100: '#f5f5f5',
    200: '#f0f0f0',
    300: '#e0e0e0',
    400: '#ccc',
    500: '#999',
    600: '#666',
    700: '#4a5568',
    800: '#1f1f1f',
    900: '#141414',
  },

  // Attribution colors
  attribution: '#e87d4f',
  attributionLight: '#a34015',
  attributionHover: '#c74d1a',
  attributionReference: '#8d23b1',
  attributionReferenceHover: '#cf45fe',

  // UI colors
  link: '#1890ff',
  border: '#d9d9d9',
  background: {
    light: '#fff',
    dark: '#141414',
    overlay: '#000000ad',
  },
};

// Theme tokens
export const lightTokens = {
  colorBgBase: colors.white,
  colorTextBase: colors.black,
  colorBgContainer: colors.white,
  colorBgElevated: colors.white,
  colorBgLayout: colors.light,
  colorBorder: colors.border,
  colorSplit: colors.gray[200],
  siderBg: colors.white,
  headerBg: colors.white,
  cardBg: colors.white,
  // Additional tokens
  textPrimary: colors.black,
  textSecondary: colors.gray[600],
  borderColor: colors.gray[400],
  backgroundColor: colors.white,
  hoverBackground: colors.gray[100],
};

export const darkTokens = {
  colorBgBase: colors.gray[900],
  colorTextBase: colors.white,
  colorBgContainer: colors.gray[800],
  colorBgElevated: colors.gray[800],
  colorBgLayout: colors.black,
  colorBorder: '#434343',
  colorSplit: '#303030',
  siderBg: colors.gray[900],
  headerBg: colors.gray[900],
  cardBg: colors.gray[800],
  // Additional tokens
  textPrimary: colors.white,
  textSecondary: colors.gray[500],
  borderColor: colors.gray[700],
  backgroundColor: colors.gray[900],
  hoverBackground: colors.gray[800],
};