// Debug environment variables
console.log('Environment variables:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
  NODE_ENV: import.meta.env.NODE_ENV,
});

export const config = {
  BASE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8004',
  localstorageKeys: {
    accessToken: 'bs-app-accessToken',
    refreshToken: 'bs-app-refreshToken',
    user: 'bs-app-user',
  },
};