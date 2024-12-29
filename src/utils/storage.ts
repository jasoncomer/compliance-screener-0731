import { IUser } from '../typings/interfaces';
import { config } from '../config/config';

const { accessToken, refreshToken, user } = config.localstorageKeys;

interface StorageKeys {
  accessToken: string;
  refreshToken: string;
  user: string;
  [key: string]: string;
}

export const storage = {
  // Auth-related storage operations
  auth: {
    setTokens(accessTokenValue: string, refreshTokenValue: string) {
      localStorage.setItem(accessToken, accessTokenValue);
      localStorage.setItem(refreshToken, refreshTokenValue);
    },
    setUser(userData: IUser) {
      localStorage.setItem(user, JSON.stringify(userData));
    },
    getAccessToken(): string | null {
      return localStorage.getItem(accessToken);
    },
    getRefreshToken(): string | null {
      return localStorage.getItem(refreshToken);
    },
    getUser(): IUser | null {
      const userData = localStorage.getItem(user);
      return userData ? JSON.parse(userData) : null;
    },
    clearAuth() {
      localStorage.removeItem(accessToken);
      localStorage.removeItem(refreshToken);
      localStorage.removeItem(user);
    }
  },

  // General storage operations
  clearAll() {
    localStorage.clear();
  },
  
  // Get all stored auth data
  getAllAuthData() {
    return {
      accessToken: this.auth.getAccessToken(),
      refreshToken: this.auth.getRefreshToken(),
      user: this.auth.getUser()
    };
  }
}; 