import { ThemeConfig } from 'antd';
import { colors } from './variables';

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorBgBase: '#ffffff',
    colorTextBase: '#000000',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f0f2f5',
    colorBorder: '#d9d9d9',
    colorSplit: '#f0f0f0',
  },
  components: {
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
    },
    Card: {
      colorBgContainer: '#ffffff',
    },
  },
};

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorBgBase: '#141414',
    colorTextBase: '#ffffff',
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#1f1f1f',
    colorBgLayout: '#000000',
    colorBorder: '#434343',
    colorSplit: '#303030',
  },
  components: {
    Layout: {
      siderBg: '#141414',
      headerBg: '#141414',
    },
    Card: {
      colorBgContainer: '#1f1f1f',
    },
  },
}; 