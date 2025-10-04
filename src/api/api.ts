import axios, { AxiosInstance } from 'axios';

import { storage } from '../utils/storage';

import { users } from './auth';
import { blockchain } from './blockchain';
import { compliance } from './compliance';
import { contactSales } from './contactSales';
import { crypto } from './crypto';
import { notesApi } from './notes';
import { organizations } from './organizations';
import { riskScoring } from './riskScoring';
import { socialMedia } from './socialMedia';
import { sot } from './sot';
import { subscription } from './subscription';

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
  riskScoring,
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
  } else {
    // Log when making requests without auth token
    console.log('🔐 Making API request without auth token:', config.url);
  }
  return config;
}, (error) => {
  console.error('❌ Request interceptor error:', error);
  return Promise.reject(error);
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log connection errors for debugging
    if (error.code === 'ERR_CONNECTION_REFUSED') {
      console.error('❌ API Connection Refused:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        message: 'Backend server might not be running or accessible'
      });
      
      // For development, show a helpful message
      if (process.env.NODE_ENV === 'development') {
        console.error('💡 Make sure the backend server is running:');
        console.error('   cd /Users/gerardoacedo/Desktop/blockscout-api');
        console.error('   npm run dev');
      }
    }
    
    if (error.response?.status === 401) {
      storage.auth.clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
