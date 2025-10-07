export const config = {
  BASE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8004/api/v1',
  MIXPANEL_TOKEN: import.meta.env.VITE_MIXPANEL_TOKEN,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
  localstorageKeys: {
    accessToken: 'bs-app-accessToken',
    refreshToken: 'bs-app-refreshToken',
    user: 'bs-app-user',
  },
};
