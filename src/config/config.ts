export const config = {
  localstorageKeys: {
    accessToken: 'bs-app-accessToken',
    refreshToken: 'bs-app-refreshToken',
    user: 'bs-app-user',
  },
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8004',
};