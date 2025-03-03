import { ThemeConfig, theme } from 'antd';
import { colors, lightTokens, darkTokens } from './variables';

export const lightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: colors.primary,
    colorBgBase: lightTokens.colorBgBase,
    colorTextBase: lightTokens.colorTextBase,
    colorBgContainer: lightTokens.colorBgContainer,
    colorBgElevated: lightTokens.colorBgElevated,
    colorBgLayout: lightTokens.colorBgLayout,
    colorBorder: lightTokens.colorBorder,
    colorSplit: lightTokens.colorSplit,
  },
  components: {
    Layout: {
      siderBg: lightTokens.siderBg,
      headerBg: lightTokens.headerBg,
    },
    Card: {
      colorBgContainer: lightTokens.cardBg,
    },
   
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: colors.primary,
    colorBgBase: darkTokens.colorBgBase,
    colorTextBase: darkTokens.colorTextBase,
    colorBgContainer: darkTokens.colorBgContainer,
    colorBgElevated: darkTokens.colorBgElevated,
    colorBgLayout: darkTokens.colorBgLayout,
    colorBorder: darkTokens.colorBorder,
    colorSplit: darkTokens.colorSplit,
  },
  components: {
    Layout: {
      siderBg: darkTokens.siderBg,
      headerBg: darkTokens.headerBg,
    },
    Card: {
      colorBgContainer: darkTokens.cardBg,
    },
  },
}; 