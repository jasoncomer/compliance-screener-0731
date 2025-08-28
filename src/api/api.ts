import axios, { AxiosInstance } from 'axios';
import { users } from './auth';
import { blockchain } from './blockchain';
import { sot } from './sot';
import { compliance } from './compliance';
import { organizations } from './organizations';
import { crypto } from './crypto';
import { subscription } from './subscription';
import { contactSales } from './contactSales';
import { socialMedia } from './socialMedia';
import { notesApi } from './notes';
import { storage } from '../utils/storage';

export const BASE_API_URL = process.env.NODE_ENV === 'production' ? 'https://api.blockscout.ai/api/v1' : 'http://localhost:8004/api/v1';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_API_URL,
  timeout: 60000,
});

export const setAuthToken = (token: string) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

export const api = {
  blockchain,
  compliance,
  contactSales,
  crypto,
  organizations,
  sot,
  socialMedia,
  subscription,
  users,
  notes: notesApi,
};

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use((config) => {
  const token = storage.auth.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storage.auth.clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
